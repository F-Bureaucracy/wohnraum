import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = (event) => {
  const org = event.locals.activeOrganization;
  if (org?.orgType !== "administration") {
    if (org?.orgType === "company") throw redirect(302, "/vermieter");
    throw redirect(302, "/settings");
  }
};
