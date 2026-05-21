import { error, fail, redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { db } from "$lib/server/db";
import { mietobjekt } from "$lib/server/db/schema";
import { geocodeAddress } from "$lib/server/geocode";
import { loadMietobjektDetail } from "$lib/server/mietobjekt-mapping";
import { mietobjektSchema } from "../new/schema";
import type { Actions, PageServerLoad } from "./$types";

const toCents = (euros: number) => Math.round(euros * 100);

function toIsoDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

export const load: PageServerLoad = async ({ params, locals }) => {
  const orgId = locals.activeOrganization?.id;
  if (!orgId) throw error(403, "Keine aktive Organisation");

  const detail = await loadMietobjektDetail(params.id, {
    organizationId: orgId,
  });

  const form = await superValidate(
    {
      organizationId: orgId,
      street: detail.street,
      houseNumber: detail.houseNumber,
      postalCode: detail.postalCode,
      city: detail.city,
      floor: detail.floor ?? "",
      unit: detail.unit ?? "",
      livingArea: detail.flaeche,
      rooms: detail.zimmer,
      bedrooms: detail.bedrooms ?? undefined,
      hasKitchen: detail.hasKitchen,
      hasBalcony: detail.hasBalcony,
      coldRent: detail.kaltmiete,
      operatingCosts: detail.nebenkosten,
      heatingCosts: detail.heizkosten,
      deposit: detail.kaution,
      availableFrom: toIsoDate(detail.availableFrom),
      minLeaseMonths: detail.minLeaseMonths ?? undefined,
      maxOccupants: detail.maxOccupants,
      barrierFree: detail.barrierFree,
      petsAllowed: detail.petsAllowed,
      description: detail.beschreibung ?? "",
    },
    zod4(mietobjektSchema),
  );

  return {
    mietobjekt: detail,
    form,
    organizations: [{ id: orgId, name: detail.vermieter ?? "" }],
  };
};

export const actions: Actions = {
  updateMietobjekt: async (event) => {
    const orgId = event.locals.activeOrganization?.id;
    if (!orgId) throw error(403, "Keine aktive Organisation");

    const form = await superValidate(event, zod4(mietobjektSchema));
    if (!form.valid) return fail(400, { form });

    const d = form.data;
    if (d.organizationId !== orgId) {
      return message(form, "Ungültige Organisation", { status: 400 });
    }

    const [existing] = await db
      .select({
        street: mietobjekt.street,
        houseNumber: mietobjekt.houseNumber,
        postalCode: mietobjekt.postalCode,
        city: mietobjekt.city,
      })
      .from(mietobjekt)
      .where(
        and(
          eq(mietobjekt.id, event.params.id),
          eq(mietobjekt.organizationId, orgId),
        ),
      )
      .limit(1);

    const addressChanged =
      !existing ||
      existing.street !== d.street ||
      existing.houseNumber !== d.houseNumber ||
      existing.postalCode !== d.postalCode ||
      existing.city !== d.city;

    const geo = addressChanged
      ? await geocodeAddress({
          street: d.street,
          houseNumber: d.houseNumber,
          postalCode: d.postalCode,
          city: d.city,
        })
      : null;

    try {
      const result = await db
        .update(mietobjekt)
        .set({
          street: d.street,
          houseNumber: d.houseNumber,
          postalCode: d.postalCode,
          city: d.city,
          ...(addressChanged
            ? {
                latitude: geo?.latitude ?? null,
                longitude: geo?.longitude ?? null,
                geocodedAt: geo ? new Date() : null,
              }
            : {}),
          floor: d.floor || null,
          unit: d.unit || null,
          livingArea: d.livingArea,
          rooms: d.rooms,
          bedrooms: d.bedrooms ?? null,
          hasKitchen: d.hasKitchen,
          hasBalcony: d.hasBalcony,
          coldRentCents: toCents(d.coldRent),
          operatingCostsCents: toCents(d.operatingCosts),
          heatingCostsCents: toCents(d.heatingCosts),
          depositCents: toCents(d.deposit),
          availableFrom: d.availableFrom,
          minLeaseMonths: d.minLeaseMonths ?? null,
          maxOccupants: d.maxOccupants,
          barrierFree: d.barrierFree,
          petsAllowed: d.petsAllowed,
          description: d.description || null,
        })
        .where(
          and(
            eq(mietobjekt.id, event.params.id),
            eq(mietobjekt.organizationId, orgId),
          ),
        )
        .returning({ id: mietobjekt.id });

      if (result.length === 0) {
        return message(form, "Mietobjekt nicht gefunden", { status: 404 });
      }
    } catch (err) {
      console.error("[mietobjekt/edit] update failed", err);
      return message(form, "Speichern fehlgeschlagen", { status: 500 });
    }

    return { form };
  },

  deleteMietobjekt: async (event) => {
    const orgId = event.locals.activeOrganization?.id;
    if (!orgId) throw error(403, "Keine aktive Organisation");

    const result = await db
      .delete(mietobjekt)
      .where(
        and(
          eq(mietobjekt.id, event.params.id),
          eq(mietobjekt.organizationId, orgId),
        ),
      )
      .returning({ id: mietobjekt.id });

    if (result.length === 0) throw error(404, "Mietobjekt nicht gefunden");

    throw redirect(303, "/vermieter/mietobjekte");
  },
};
