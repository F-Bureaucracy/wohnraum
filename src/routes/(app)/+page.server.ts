import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = (event) => {
  const org = event.locals.activeOrganization;
  if (org?.orgType === "administration") throw redirect(302, "/admin");
  if (org?.orgType === "company") throw redirect(302, "/vermieter");
  throw redirect(302, "/settings");
};
