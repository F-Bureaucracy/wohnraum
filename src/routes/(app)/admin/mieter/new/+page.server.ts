import { error, redirect } from "@sveltejs/kit";
import { fail, message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { writeAppAuditLog } from "$lib/server/audit";
import { db } from "$lib/server/db";
import { mieter } from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";
import { mieterSchema } from "./schema";

const toCents = (euros: number) => Math.round(euros * 100);

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, "/login");
  if (locals.activeOrganization?.orgType !== "administration") {
    throw error(403, "Nur Administration darf Mieter anlegen");
  }
  const form = await superValidate(zod4(mieterSchema));
  return { form };
};

export const actions: Actions = {
  default: async (event) => {
    if (!event.locals.user) throw redirect(302, "/login");
    const activeOrg = event.locals.activeOrganization;
    if (activeOrg?.orgType !== "administration") {
      throw error(403, "Nur Administration darf Mieter anlegen");
    }

    const form = await superValidate(event, zod4(mieterSchema));
    if (!form.valid) return fail(400, { form });

    const d = form.data;
    try {
      const [created] = await db
        .insert(mieter)
        .values({
          organizationId: activeOrg.id,
          firstName: d.firstName,
          lastName: d.lastName,
          dateOfBirth: d.dateOfBirth || null,
          gender: d.gender ?? null,
          email: d.email || null,
          phone: d.phone || null,
          householdSize: d.householdSize,
          maxColdRentCents:
            typeof d.maxColdRent === "number" ? toCents(d.maxColdRent) : null,
          needsBarrierFree: d.needsBarrierFree,
          hasPets: d.hasPets,
          availableFrom: d.availableFrom || null,
          notes: d.notes || null,
        })
        .returning();

      await writeAppAuditLog(event, {
        action: "mieter:create",
        entityType: "mieter",
        entityId: created.id,
        severity: "medium",
        metadata: {
          label: `${created.firstName} ${created.lastName}`,
        },
        after: created,
      });
    } catch (err) {
      console.error("[mieter/new] insert failed", err);
      return message(form, "Speichern fehlgeschlagen", { status: 500 });
    }

    throw redirect(302, "/admin/mieter");
  },
};
