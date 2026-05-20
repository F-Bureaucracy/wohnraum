import { desc, eq, sql } from "drizzle-orm";
import { db } from "$lib/server/db";
import { mietobjekt, organization } from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const rows = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
      anzahlMietobjekte: sql<number>`count(${mietobjekt.id})::int`,
    })
    .from(organization)
    .leftJoin(mietobjekt, eq(mietobjekt.organizationId, organization.id))
    .where(eq(organization.orgType, "company"))
    .groupBy(organization.id)
    .orderBy(desc(organization.createdAt));

  return { vermieter: rows };
};
