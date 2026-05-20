import { error, fail } from "@sveltejs/kit";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "$lib/server/db";
import { mietobjekt } from "$lib/server/db/schema";
import { mapMietobjektRow } from "$lib/server/mietobjekt-mapping";
import type { Actions, PageServerLoad } from "./$types";

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

export const actions: Actions = {
  deleteMietobjekt: async (event) => {
    const orgId = event.locals.activeOrganization?.id;
    if (!orgId) throw error(403, "Keine aktive Organisation");

    const data = await event.request.formData();
    const ids = data
      .getAll("mietobjektId")
      .map((v) => v.toString())
      .filter(Boolean);
    if (ids.length === 0) return fail(400, { message: "Keine Auswahl" });

    await db
      .delete(mietobjekt)
      .where(
        and(eq(mietobjekt.organizationId, orgId), inArray(mietobjekt.id, ids)),
      );

    return { success: true };
  },
};
