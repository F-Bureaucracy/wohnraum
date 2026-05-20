import { desc } from "drizzle-orm";
import { db } from "$lib/server/db";
import { mietobjekt } from "$lib/server/db/schema";
import { mapMietobjektRow } from "$lib/server/mietobjekt-mapping";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const rows = await db
    .select()
    .from(mietobjekt)
    .orderBy(desc(mietobjekt.createdAt));
  return { mietobjekte: rows.map(mapMietobjektRow) };
};
