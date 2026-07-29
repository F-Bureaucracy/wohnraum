// Applies pending migrations from ./drizzle and exits.
//
// Deployed as an Argo CD PreSync hook by the f-bau-app chart, which runs this
// image under `bun ./build/migrate.js` before rolling out the new app version.
// The previous version is still serving while this runs, so migrations have to
// be backwards compatible: add and backfill in one release, drop in a later one.
//
// Kept separate from src/lib/server/db/index.ts because that module reads
// $env/dynamic/private, which only exists inside SvelteKit.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

// max: 1 - the migrator runs statements sequentially and expects them on one
// connection, so a pool would let a transaction and its statements diverge.
const client = postgres(url, { max: 1 });

try {
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
} finally {
  await client.end();
}
