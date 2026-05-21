import { and, eq } from "drizzle-orm";
import { error } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { mieter, mietobjekt, organization } from "$lib/server/db/schema";
import { getMietobjektFeatureValues } from "$lib/matching-flags";
import type { Mietobjekt } from "$lib/components/columns-mietobjekte";

type Row = typeof mietobjekt.$inferSelect;

export function mapMietobjektRow(r: Row): Mietobjekt {
  return {
    id: r.id,
    adresse: `${r.street} ${r.houseNumber}, ${r.postalCode} ${r.city}`,
    zimmer: r.rooms,
    flaeche: r.livingArea,
    kaltmiete: r.coldRentCents / 100,
    maxOccupants: r.maxOccupants,
    ...getMietobjektFeatureValues(r),
    lat: r.latitude ?? undefined,
    lng: r.longitude ?? undefined,
    createdAt: r.createdAt,
  };
}

export type MietobjektDetail = {
  id: string;
  adresse: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  floor: string | null;
  unit: string | null;
  zimmer: number;
  bedrooms: number | null;
  flaeche: number;
  hasKitchen: boolean;
  hasBalcony: boolean;
  kaltmiete: number;
  nebenkosten: number;
  heizkosten: number;
  kaution: number;
  availableFrom: string | Date | null;
  minLeaseMonths: number | null;
  maxOccupants: number;
  barrierFree: boolean;
  petsAllowed: boolean;
  beschreibung: string | null;
  vermieter: string | null;
  vermieterId: string;
  createdAt: Date;
};

export async function loadMietobjektDetail(
  id: string,
  opts: { organizationId?: string } = {},
): Promise<MietobjektDetail> {
  const conditions = [eq(mietobjekt.id, id)];
  if (opts.organizationId) {
    conditions.push(eq(mietobjekt.organizationId, opts.organizationId));
  }

  const [row] = await db
    .select({ m: mietobjekt, organizationName: organization.name })
    .from(mietobjekt)
    .leftJoin(organization, eq(organization.id, mietobjekt.organizationId))
    .where(and(...conditions))
    .limit(1);

  if (!row) throw error(404, "Mietobjekt nicht gefunden");

  const m = row.m;
  return {
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
    kaltmiete: m.coldRentCents / 100,
    nebenkosten: m.operatingCostsCents / 100,
    heizkosten: m.heatingCostsCents / 100,
    kaution: m.depositCents / 100,
    availableFrom: m.availableFrom,
    minLeaseMonths: m.minLeaseMonths,
    maxOccupants: m.maxOccupants,
    ...getMietobjektFeatureValues(m),
    beschreibung: m.description,
    vermieter: row.organizationName,
    vermieterId: m.organizationId,
    createdAt: m.createdAt,
  };
}

export type MietobjektBewohner = {
  id: string;
  name: string;
};

export async function loadMietobjektBewohner(
  mietobjektId: string,
): Promise<MietobjektBewohner[]> {
  const rows = await db
    .select({
      id: mieter.id,
      firstName: mieter.firstName,
      lastName: mieter.lastName,
    })
    .from(mieter)
    .where(eq(mieter.mietobjektId, mietobjektId))
    .orderBy(mieter.lastName, mieter.firstName);

  return rows.map((r) => ({ id: r.id, name: `${r.firstName} ${r.lastName}` }));
}
