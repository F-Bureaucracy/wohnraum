import { error, fail, redirect } from "@sveltejs/kit";
import { isKnownFeature } from "$lib/features";
import { auth } from "$lib/server/auth";
import { getOrgFeatures, setOrgFeature } from "$lib/server/org-settings";
import type { Actions, PageServerLoad } from "./$types";

async function requireAdministrationManager(event: {
  request: Request;
  locals: App.Locals;
}): Promise<{ organizationId: string }> {
  if (!event.locals.user) throw redirect(302, "/login");
  const org = event.locals.activeOrganization;
  if (org?.orgType !== "administration") {
    throw error(403, "Nur die Administration darf Features verwalten");
  }
  const activeMember = await auth.api
    .getActiveMember({ headers: event.request.headers })
    .catch(() => null);
  const role = activeMember?.role ?? "";
  if (role !== "owner" && role !== "admin") {
    throw error(403, "Keine Berechtigung, Features zu verwalten");
  }
  return { organizationId: org.id };
}

export const load: PageServerLoad = async (event) => {
  const { organizationId } = await requireAdministrationManager(event);
  return { features: await getOrgFeatures(organizationId) };
};

export const actions: Actions = {
  toggle: async (event) => {
    const { organizationId } = await requireAdministrationManager(event);

    const form = await event.request.formData();
    const key = String(form.get("key") ?? "");
    const enabled = form.get("enabled") === "true";

    if (!isKnownFeature(key)) {
      return fail(400, { message: "Unbekanntes Feature" });
    }

    try {
      await setOrgFeature(organizationId, key, enabled);
      return { success: true };
    } catch (err) {
      console.error("[settings/features] toggle failed", err);
      return fail(500, { message: "Speichern fehlgeschlagen" });
    }
  },
};
