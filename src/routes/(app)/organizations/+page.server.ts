import { redirect } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import { fail, message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { auth } from "$lib/server/auth";
import type { Actions, PageServerLoad } from "./$types";
import { createOrganizationSchema } from "./schema";

export const load: PageServerLoad = () => {
  throw redirect(302, "/");
};

export const actions: Actions = {
  setActiveOrganization: async (event) => {
    const data = await event.request.formData();
    const organizationId = data.get("organizationId");
    if (typeof organizationId !== "string" || !organizationId) {
      return fail(400, { error: "Missing organizationId" });
    }
    try {
      await auth.api.setActiveOrganization({
        headers: event.request.headers,
        body: { organizationId },
      });
    } catch (error) {
      if (error instanceof APIError) {
        return fail(error.statusCode ?? 400, { error: error.message });
      }
      return fail(500, { error: "Unexpected error" });
    }
    return { success: true };
  },

  createOrganization: async (event) => {
    const form = await superValidate(event, zod4(createOrganizationSchema));
    if (!form.valid) return fail(400, { form });

    try {
      await auth.api.createOrganization({
        headers: event.request.headers,
        body: {
          name: form.data.name,
          slug: form.data.slug,
          orgType: "company",
        },
      });
    } catch (error) {
      if (error instanceof APIError) {
        return message(form, error.message || "Could not create organization", {
          status: 400,
        });
      }
      return message(form, "Unexpected error", { status: 500 });
    }

    return { form };
  },
};
