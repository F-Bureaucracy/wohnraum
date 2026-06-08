import { and, desc, eq, inArray } from "drizzle-orm";
import { error, fail, redirect } from "@sveltejs/kit";
import { writeAppAuditLog } from "$lib/server/audit";
import { db } from "$lib/server/db";
import { mieter, mietobjekt, note } from "$lib/server/db/schema";
import { getBookmarkedIds, toggleBookmarkAction } from "$lib/server/bookmarks";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, "/login");
  const activeOrg = locals.activeOrganization;
  if (activeOrg?.orgType !== "administration") {
    throw error(403, "Nur Administration");
  }

  const rows = await db
    .select({
      id: mieter.id,
      firstName: mieter.firstName,
      lastName: mieter.lastName,
      email: mieter.email,
      phone: mieter.phone,
      householdSize: mieter.householdSize,
      maxColdRentCents: mieter.maxColdRentCents,
      features: mieter.features,
      createdAt: mieter.createdAt,
      mietobjektStreet: mietobjekt.street,
      mietobjektHouseNumber: mietobjekt.houseNumber,
      mietobjektPostalCode: mietobjekt.postalCode,
      mietobjektCity: mietobjekt.city,
    })
    .from(mieter)
    .leftJoin(mietobjekt, eq(mietobjekt.id, mieter.mietobjektId))
    .where(eq(mieter.organizationId, activeOrg.id))
    .orderBy(desc(mieter.createdAt));

  const bookmarked = await getBookmarkedIds(locals.user.id, "mieter");

  return {
    mieter: rows.map((r) => ({
      id: r.id,
      name: `${r.firstName} ${r.lastName}`,
      email: r.email ?? "",
      telefon: r.phone ?? "",
      mietobjekt:
        r.mietobjektStreet &&
        r.mietobjektHouseNumber &&
        r.mietobjektPostalCode &&
        r.mietobjektCity
          ? `${r.mietobjektStreet} ${r.mietobjektHouseNumber}, ${r.mietobjektPostalCode} ${r.mietobjektCity}`
          : "—",
      householdSize: r.householdSize,
      maxColdRent:
        r.maxColdRentCents != null ? r.maxColdRentCents / 100 : undefined,
      features: r.features ?? {},
      ...(r.features ?? {}),
      bookmarked: bookmarked.has(r.id),
      createdAt: r.createdAt,
    })),
  };
};

export const actions: Actions = {
  toggleBookmark: toggleBookmarkAction,

  deleteMieter: async (event) => {
    if (!event.locals.user) throw redirect(302, "/login");
    const activeOrg = event.locals.activeOrganization;
    if (activeOrg?.orgType !== "administration") {
      throw error(403, "Nur Administration");
    }

    const data = await event.request.formData();
    const ids = data
      .getAll("mieterId")
      .map((v) => v.toString())
      .filter(Boolean);
    if (ids.length === 0) return fail(400, { message: "Keine Auswahl" });

    const deleted = await db
      .delete(mieter)
      .where(
        and(eq(mieter.organizationId, activeOrg.id), inArray(mieter.id, ids)),
      )
      .returning();

    // Polymorphic notes have no DB cascade, so remove them explicitly.
    if (deleted.length > 0) {
      await db.delete(note).where(
        and(
          eq(note.entityType, "mieter"),
          inArray(
            note.entityId,
            deleted.map((row) => row.id),
          ),
        ),
      );
    }

    await Promise.all(
      deleted.map((row) =>
        writeAppAuditLog(event, {
          action: "mieter:delete",
          entityType: "mieter",
          entityId: row.id,
          severity: "high",
          metadata: {
            label: `${row.firstName} ${row.lastName}`,
            bulk: true,
          },
          before: row,
        }),
      ),
    );

    return { success: true };
  },
};
