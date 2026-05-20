import { desc, eq } from "drizzle-orm";
import { error, redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { mieter } from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

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
      createdAt: mieter.createdAt,
    })
    .from(mieter)
    .where(eq(mieter.organizationId, activeOrg.id))
    .orderBy(desc(mieter.createdAt));

  return {
    mieter: rows.map((r) => ({
      id: r.id,
      name: `${r.firstName} ${r.lastName}`,
      email: r.email ?? "",
      telefon: r.phone ?? "",
      mietobjekt: "",
      createdAt: r.createdAt,
    })),
  };
};
