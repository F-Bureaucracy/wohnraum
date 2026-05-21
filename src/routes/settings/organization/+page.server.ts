import { error, redirect } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import { fail, message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { auth } from "$lib/server/auth";
import type { Actions, PageServerLoad } from "./$types";
import { organizationSchema } from "./schema";

async function requireOrgManager(headers: Headers) {
  const activeMember = await auth.api
    .getActiveMember({ headers })
    .catch(() => null);
  const role = activeMember?.role ?? "";
  if (role !== "owner" && role !== "admin") {
    throw error(403, "Keine Berechtigung, diese Organisation zu verwalten");
  }
}

export const load: PageServerLoad = async (event) => {
  if (!event.locals.user) throw redirect(302, "/login");
  await requireOrgManager(event.request.headers);

  const org = await auth.api
    .getFullOrganization({ headers: event.request.headers })
    .catch(() => null);
  if (!org) throw error(403, "Keine aktive Organisation");

  return {
    organizationForm: await superValidate(
      { name: org.name, slug: org.slug, logo: org.logo ?? "" },
      zod4(organizationSchema),
    ),
  };
};

export const actions: Actions = {
  updateOrganization: async (event) => {
    if (!event.locals.user) throw redirect(302, "/login");
    await requireOrgManager(event.request.headers);

    const form = await superValidate(event, zod4(organizationSchema));
    if (!form.valid) return fail(400, { form });

    try {
      await auth.api.updateOrganization({
        headers: event.request.headers,
        body: {
          data: {
            name: form.data.name,
            slug: form.data.slug,
            logo: form.data.logo || undefined,
          },
        },
      });
    } catch (err) {
      if (err instanceof APIError) {
        return message(
          form,
          err.message || "Organisation konnte nicht aktualisiert werden",
          { status: 400 },
        );
      }
      return message(form, "Unerwarteter Fehler", { status: 500 });
    }

    return message(form, "Organisation aktualisiert");
  },
};
