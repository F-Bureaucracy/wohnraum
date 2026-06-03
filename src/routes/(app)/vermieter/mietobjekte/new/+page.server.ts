import { error, redirect } from "@sveltejs/kit";
import { fail, message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { auth } from "$lib/server/auth";
import { writeAppAuditLog } from "$lib/server/audit";
import { db } from "$lib/server/db";
import { mietobjekt } from "$lib/server/db/schema";
import { geocodeAddress } from "$lib/server/geocode";
import { replaceMietobjektImages } from "$lib/server/mietobjekt-images";
import { loadFilterDefinitions } from "$lib/server/filter-definitions";
import { sanitizeFeatures } from "$lib/matching-flags";
import type { Actions, PageServerLoad } from "./$types";
import { mietobjektSchema } from "./schema";

const toCents = (euros: number) => Math.round(euros * 100);

async function loadCompanyOrgs(headers: Headers) {
  const orgs = await auth.api
    .listOrganizations({ headers })
    .catch(() => [] as Array<{ id: string; name: string; orgType?: string }>);
  return orgs.filter((o) => (o as { orgType?: string }).orgType === "company");
}

export const load: PageServerLoad = async (event) => {
  if (!event.locals.user) throw redirect(302, "/login");

  const orgs = await loadCompanyOrgs(event.request.headers);
  if (orgs.length === 0) throw error(403, "Keine Vermieter-Organisation");

  const activeOrgId = event.locals.activeOrganization?.id ?? orgs[0].id;

  const form = await superValidate(zod4(mietobjektSchema));
  form.data.organizationId = activeOrgId;

  return {
    form,
    organizations: orgs.map((o) => ({ id: o.id, name: o.name })),
  };
};

export const actions: Actions = {
  default: async (event) => {
    if (!event.locals.user) throw redirect(302, "/login");

    const form = await superValidate(event, zod4(mietobjektSchema));
    if (!form.valid) return fail(400, { form });

    const orgs = await loadCompanyOrgs(event.request.headers);
    if (!orgs.some((o) => o.id === form.data.organizationId)) {
      return message(form, "Ungültige Organisation", { status: 400 });
    }

    const d = form.data;
    const defs = await loadFilterDefinitions();
    const geo = await geocodeAddress({
      street: d.street,
      houseNumber: d.houseNumber,
      postalCode: d.postalCode,
      city: d.city,
    });
    try {
      const [created] = await db
        .insert(mietobjekt)
        .values({
          organizationId: d.organizationId,
          street: d.street,
          houseNumber: d.houseNumber,
          postalCode: d.postalCode,
          city: d.city,
          latitude: geo?.latitude ?? null,
          longitude: geo?.longitude ?? null,
          geocodedAt: geo ? new Date() : null,
          floor: d.floor || null,
          unit: d.unit || null,
          livingArea: d.livingArea,
          rooms: d.rooms,
          bedrooms: d.bedrooms ?? null,
          coldRentCents: toCents(d.coldRent),
          operatingCostsCents: toCents(d.operatingCosts),
          heatingCostsCents: toCents(d.heatingCosts),
          depositCents: toCents(d.deposit),
          availableFrom: d.availableFrom,
          minLeaseMonths: d.minLeaseMonths ?? null,
          maxOccupants: d.maxOccupants,
          features: sanitizeFeatures(defs, d.features, "mietobjekt"),
          description: d.description || null,
        })
        .returning();

      await writeAppAuditLog(event, {
        action: "mietobjekt:create",
        entityType: "mietobjekt",
        entityId: created.id,
        organizationId: created.organizationId,
        severity: "medium",
        metadata: {
          label: `${created.street} ${created.houseNumber}, ${created.city}`,
        },
        after: created,
      });

      await replaceMietobjektImages(created.id, d.images);
    } catch (err) {
      console.error("[mietobjekt/new] insert failed", err);
      return message(form, "Speichern fehlgeschlagen", { status: 500 });
    }

    throw redirect(302, "/vermieter");
  },
};
