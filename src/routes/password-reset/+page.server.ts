import { redirect } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import { fail, message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { auth } from "$lib/server/auth";
import type { Actions, PageServerLoad } from "./$types";
import { passwordResetSchema } from "./schema";

export const load: PageServerLoad = async (event) => {
  if (event.locals.user) {
    return redirect(302, "/");
  }
  return { form: await superValidate(zod4(passwordResetSchema)) };
};

export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event, zod4(passwordResetSchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    const { email } = form.data;

    try {
      await auth.api.requestPasswordReset({
        body: {
          email,
          redirectTo: "/password-reset/confirm",
        },
      });
    } catch (error) {
      console.error("[password-reset] forgetPassword failed:", error);
      if (error instanceof APIError) {
        return message(form, error.message || "Could not send reset email", {
          status: 400,
        });
      }
      return message(form, "Unexpected error", { status: 500 });
    }

    return message(form, "If that email exists, a reset link has been sent.");
  },
};
