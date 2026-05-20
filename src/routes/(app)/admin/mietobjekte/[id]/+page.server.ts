import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { mietobjekt, organization } from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const [row] = await db
    .select({
      m: mietobjekt,
      organizationName: organization.name,
    })
    .from(mietobjekt)
    .leftJoin(organization, eq(organization.id, mietobjekt.organizationId))
    .where(eq(mietobjekt.id, params.id))
    .limit(1);

  if (!row) error(404, "Mietobjekt nicht gefunden");

  const m = row.m;
  return {
    mietobjekt: {
      id: m.id,
      adresse: `${m.street} ${m.houseNumber}, ${m.postalCode} ${m.city}`,
      street: m.street,
      houseNumber: m.houseNumber,
      postalCode: m.postalCode,
      city: m.city,
      floor: m.floor,
      unit: m.unit,
      zimmer: m.rooms,
      bedrooms: m.bedrooms,
      flaeche: m.livingArea,
      hasKitchen: m.hasKitchen,
      hasBalcony: m.hasBalcony,
      kaltmiete: m.coldRentCents / 100,
      nebenkosten: m.operatingCostsCents / 100,
      heizkosten: m.heatingCostsCents / 100,
      kaution: m.depositCents / 100,
      availableFrom: m.availableFrom,
      minLeaseMonths: m.minLeaseMonths,
      maxOccupants: m.maxOccupants,
      barrierFree: m.barrierFree,
      petsAllowed: m.petsAllowed,
      beschreibung: m.description,
      vermieter: row.organizationName,
      createdAt: m.createdAt,
    },
  };
};
