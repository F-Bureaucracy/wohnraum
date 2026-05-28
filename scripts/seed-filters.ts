/**
 * Seed the global matching filter definitions from
 * `src/lib/server/db/seed/filters.json`.
 *
 * Idempotent: upserts by `key`, so re-running updates labels/targeting without
 * creating duplicates. Run with `bun run db:seed`.
 *
 * Standalone (not loaded through SvelteKit), so it builds its own DB connection
 * from `process.env.DATABASE_URL` rather than the app's `$env`-based client.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { filterDefinition } from "../src/lib/server/db/schema";

type SeedFilter = {
  key: string;
  label: string;
  mieterLabel: string | null;
  appliesToMietobjekt: boolean;
  appliesToMieter: boolean;
  sortOrder: number;
};

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const here = dirname(fileURLToPath(import.meta.url));
const seedPath = join(here, "../src/lib/server/db/seed/filters.json");
const filters = JSON.parse(readFileSync(seedPath, "utf8")) as SeedFilter[];

const client = postgres(url);
const db = drizzle(client);

let count = 0;
for (const f of filters) {
  await db
    .insert(filterDefinition)
    .values(f)
    .onConflictDoUpdate({
      target: filterDefinition.key,
      set: {
        label: f.label,
        mieterLabel: f.mieterLabel,
        appliesToMietobjekt: f.appliesToMietobjekt,
        appliesToMieter: f.appliesToMieter,
        sortOrder: f.sortOrder,
      },
    });
  count++;
}

console.log(`Seeded ${count} filter definitions.`);
await client.end();
