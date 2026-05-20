import { error } from "@sveltejs/kit";
import { desc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { mietobjekt } from "$lib/server/db/schema";
import { mapMietobjektRow } from "$lib/server/mietobjekt-mapping";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const orgId = event.locals.activeOrganization?.id;
  if (!orgId) throw error(403, "Keine aktive Organisation");

  const rows = await db
    .select()
    .from(mietobjekt)
    .where(eq(mietobjekt.organizationId, orgId))
    .orderBy(desc(mietobjekt.createdAt));

  return { mietobjekte: rows.map(mapMietobjektRow) };
};
