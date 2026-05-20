import { redirect } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { auth } from "$lib/server/auth";
import { createOrganizationSchema } from "./organizations/schema";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async (event) => {
  if (!event.locals.user) {
    throw redirect(302, "/login");
  }

  const orgs = await auth.api
    .listOrganizations({ headers: event.request.headers })
    .catch(() => [] as Array<{ id: string; name: string; slug: string }>);

  const createOrganizationForm = await superValidate(
    zod4(createOrganizationSchema),
  );

  return {
    user: event.locals.user,
    activeOrganization: event.locals.activeOrganization ?? null,
    organizations: orgs.map((o) => ({ id: o.id, name: o.name, slug: o.slug })),
    createOrganizationForm,
  };
};
