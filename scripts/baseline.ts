// Marks migrations as applied WITHOUT running them.
//
// One-time step for databases that were built with `drizzle-kit push` before
// this project had versioned migrations. Their tables already exist, so the
// 0000 baseline would fail on `CREATE TABLE ... already exists`; this records it
// as done instead, and the next `migrate` picks up from 0001.
//
// Run once per pre-existing database, against a port-forwarded connection:
//   kubectl -n <ns> port-forward svc/<customer>-pg-rw 5432:5432
//   DATABASE_URL=postgresql://... bun run db:baseline
//
// A brand new database needs none of this - `migrate` creates everything.
import { readMigrationFiles } from "drizzle-orm/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

// Reads drizzle/meta/_journal.json and hashes each .sql exactly the way the
// migrator does, so the rows written here are the ones it looks for.
const migrations = readMigrationFiles({ migrationsFolder: "./drizzle" });
const client = postgres(url, { max: 1 });

try {
  await client.unsafe(`CREATE SCHEMA IF NOT EXISTS "drizzle"`);
  await client.unsafe(
    `CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
       id SERIAL PRIMARY KEY,
       hash text NOT NULL,
       created_at bigint
     )`,
  );

  for (const migration of migrations) {
    const short = migration.hash.slice(0, 12);
    const existing = await client`
      select 1 from "drizzle"."__drizzle_migrations" where hash = ${migration.hash}
    `;
    if (existing.length > 0) {
      console.log(`already recorded, skipping: ${short}`);
      continue;
    }
    await client`
      insert into "drizzle"."__drizzle_migrations" ("hash", "created_at")
      values (${migration.hash}, ${migration.folderMillis})
    `;
    console.log(`stamped as applied: ${short} (${migration.folderMillis})`);
  }
} finally {
  await client.end();
}
