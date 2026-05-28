import { error, fail, redirect } from "@sveltejs/kit";
import { desc, eq } from "drizzle-orm";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { filterDefinition } from "$lib/server/db/schema";
import { loadFilterDefinitions } from "$lib/server/filter-definitions";
import { slugify } from "$lib/utils";
import type { Actions, PageServerLoad } from "./$types";
import { filterSchema } from "./schema";

async function requireAdministrationManager(event: {
  request: Request;
  locals: App.Locals;
}) {
  if (!event.locals.user) throw redirect(302, "/login");
  if (event.locals.activeOrganization?.orgType !== "administration") {
    throw error(403, "Nur die Administration darf Filter verwalten");
  }
  const activeMember = await auth.api
    .getActiveMember({ headers: event.request.headers })
    .catch(() => null);
  const role = activeMember?.role ?? "";
  if (role !== "owner" && role !== "admin") {
    throw error(403, "Keine Berechtigung, Filter zu verwalten");
  }
}

async function uniqueKey(base: string): Promise<string> {
  const slug = slugify(base) || "filter";
  const existing = await db
    .select({ key: filterDefinition.key })
    .from(filterDefinition);
  const taken = new Set(existing.map((r) => r.key));
  if (!taken.has(slug)) return slug;
  let i = 2;
  while (taken.has(`${slug}-${i}`)) i++;
  return `${slug}-${i}`;
}

export const load: PageServerLoad = async (event) => {
  await requireAdministrationManager(event);
  return {
    filters: await loadFilterDefinitions(),
    filterForm: await superValidate(zod4(filterSchema)),
  };
};

export const actions: Actions = {
  saveFilter: async (event) => {
    await requireAdministrationManager(event);

    const form = await superValidate(event, zod4(filterSchema));
    if (!form.valid) return fail(400, { form });

    const d = form.data;
    const mieterLabel = d.mieterLabel?.trim() ? d.mieterLabel.trim() : null;

    try {
      if (d.key) {
        const result = await db
          .update(filterDefinition)
          .set({
            label: d.label,
            mieterLabel,
            appliesToMietobjekt: d.appliesToMietobjekt,
            appliesToMieter: d.appliesToMieter,
          })
          .where(eq(filterDefinition.key, d.key))
          .returning();
        if (result.length === 0) {
          return message(form, "Filter nicht gefunden", { status: 404 });
        }
        return message(form, "Filter aktualisiert");
      }

      const [{ value: maxSort } = { value: 0 }] = await db
        .select({ value: filterDefinition.sortOrder })
        .from(filterDefinition)
        .orderBy(desc(filterDefinition.sortOrder))
        .limit(1);
      const key = await uniqueKey(d.label);
      await db.insert(filterDefinition).values({
        key,
        label: d.label,
        mieterLabel,
        appliesToMietobjekt: d.appliesToMietobjekt,
        appliesToMieter: d.appliesToMieter,
        sortOrder: (maxSort ?? 0) + 10,
      });
      return message(form, "Filter erstellt");
    } catch (err) {
      console.error("[settings/filters] saveFilter failed", err);
      return message(form, "Speichern fehlgeschlagen", { status: 500 });
    }
  },

  deleteFilter: async (event) => {
    await requireAdministrationManager(event);

    const data = await event.request.formData();
    const key = String(data.get("key") ?? "");
    if (!key) return fail(400, { message: "Kein Filter angegeben" });

    await db.delete(filterDefinition).where(eq(filterDefinition.key, key));
    return { success: true };
  },
};
