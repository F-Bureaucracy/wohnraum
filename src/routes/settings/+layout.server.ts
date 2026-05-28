import { redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/auth";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async (event) => {
  if (!event.locals.user) {
    throw redirect(302, "/login");
  }

  const activeMember = await auth.api
    .getActiveMember({ headers: event.request.headers })
    .catch(() => null);
  const role = activeMember?.role ?? "";
  const canManageOrg = role === "owner" || role === "admin";
  const isAdministration =
    event.locals.activeOrganization?.orgType === "administration";

  return { user: event.locals.user, canManageOrg, isAdministration };
};
