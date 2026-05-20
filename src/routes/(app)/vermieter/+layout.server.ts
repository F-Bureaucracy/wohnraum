import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = (event) => {
  const org = event.locals.activeOrganization;
  if (org?.orgType !== "company") {
    if (org?.orgType === "administration") throw redirect(302, "/admin");
    throw redirect(302, "/settings");
  }
};
