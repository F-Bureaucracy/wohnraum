import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "$env/dynamic/private";
import * as schema from "./schema";

if (!env.DATABASE_URL) {
  console.log(env);
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, { schema });
