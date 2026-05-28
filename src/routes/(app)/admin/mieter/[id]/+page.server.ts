import { error, redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { fail, message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { writeAppAuditLog } from "$lib/server/audit";
import { db } from "$lib/server/db";
import { mieter } from "$lib/server/db/schema";
import { getBookmarkedIds, toggleBookmarkAction } from "$lib/server/bookmarks";
import { loadFilterDefinitions } from "$lib/server/filter-definitions";
import { sanitizeFeatures } from "$lib/matching-flags";
import { mieterSchema } from "../new/schema";
import type { Actions, PageServerLoad } from "./$types";

const toCents = (euros: number) => Math.round(euros * 100);

const genderValues = ["female", "male", "diverse", "unspecified"] as const;
type Gender = (typeof genderValues)[number];
function toGender(value: string | null): Gender | undefined {
  return genderValues.includes(value as Gender) ? (value as Gender) : undefined;
}

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user) throw redirect(302, "/login");
  const activeOrg = locals.activeOrganization;
  if (activeOrg?.orgType !== "administration") {
    throw error(403, "Nur Administration");
  }

  const [row] = await db
    .select()
    .from(mieter)
    .where(
      and(eq(mieter.id, params.id), eq(mieter.organizationId, activeOrg.id)),
    )
    .limit(1);

  if (!row) throw error(404, "Mieter nicht gefunden");

  const form = await superValidate(
    {
      firstName: row.firstName,
      lastName: row.lastName,
      dateOfBirth: row.dateOfBirth ?? "",
      gender: toGender(row.gender),
      email: row.email ?? "",
      phone: row.phone ?? "",
      householdSize: row.householdSize,
      maxColdRent:
        row.maxColdRentCents != null ? row.maxColdRentCents / 100 : undefined,
      features: row.features ?? {},
      availableFrom: row.availableFrom ?? "",
      notes: row.notes ?? "",
    },
    zod4(mieterSchema),
  );

  const bookmarked = (await getBookmarkedIds(locals.user.id, "mieter")).has(
    params.id,
  );

  return { mieter: row, form, bookmarked };
};

export const actions: Actions = {
  toggleBookmark: toggleBookmarkAction,

  updateMieter: async (event) => {
    if (!event.locals.user) throw redirect(302, "/login");
    const activeOrg = event.locals.activeOrganization;
    if (activeOrg?.orgType !== "administration") {
      throw error(403, "Nur Administration");
    }

    const form = await superValidate(event, zod4(mieterSchema));
    if (!form.valid) return fail(400, { form });

    const d = form.data;
    const defs = await loadFilterDefinitions();
    try {
      const [before] = await db
        .select()
        .from(mieter)
        .where(
          and(
            eq(mieter.id, event.params.id),
            eq(mieter.organizationId, activeOrg.id),
          ),
        )
        .limit(1);

      const result = await db
        .update(mieter)
        .set({
          firstName: d.firstName,
          lastName: d.lastName,
          dateOfBirth: d.dateOfBirth || null,
          gender: d.gender ?? null,
          email: d.email || null,
          phone: d.phone || null,
          householdSize: d.householdSize,
          maxColdRentCents:
            typeof d.maxColdRent === "number" ? toCents(d.maxColdRent) : null,
          features: sanitizeFeatures(defs, d.features, "mieter"),
          availableFrom: d.availableFrom || null,
          notes: d.notes || null,
        })
        .where(
          and(
            eq(mieter.id, event.params.id),
            eq(mieter.organizationId, activeOrg.id),
          ),
        )
        .returning();

      if (result.length === 0) {
        return message(form, "Mieter nicht gefunden", { status: 404 });
      }

      await writeAppAuditLog(event, {
        action: "mieter:update",
        entityType: "mieter",
        entityId: result[0].id,
        severity: "medium",
        metadata: {
          label: `${result[0].firstName} ${result[0].lastName}`,
        },
        before,
        after: result[0],
      });
    } catch (err) {
      console.error("[mieter/edit] update failed", err);
      return message(form, "Speichern fehlgeschlagen", { status: 500 });
    }

    return { form };
  },

  deleteMieter: async (event) => {
    if (!event.locals.user) throw redirect(302, "/login");
    const activeOrg = event.locals.activeOrganization;
    if (activeOrg?.orgType !== "administration") {
      throw error(403, "Nur Administration");
    }

    const result = await db
      .delete(mieter)
      .where(
        and(
          eq(mieter.id, event.params.id),
          eq(mieter.organizationId, activeOrg.id),
        ),
      )
      .returning();

    if (result.length === 0) throw error(404, "Mieter nicht gefunden");

    await writeAppAuditLog(event, {
      action: "mieter:delete",
      entityType: "mieter",
      entityId: result[0].id,
      severity: "high",
      metadata: {
        label: `${result[0].firstName} ${result[0].lastName}`,
      },
      before: result[0],
    });

    throw redirect(303, "/admin/mieter");
  },
};
