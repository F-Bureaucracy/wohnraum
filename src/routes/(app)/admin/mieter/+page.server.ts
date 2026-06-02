import { desc, eq } from "drizzle-orm";
import { error, redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { mieter, mietobjekt } from "$lib/server/db/schema";
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
};
