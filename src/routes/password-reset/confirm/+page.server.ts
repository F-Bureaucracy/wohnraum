import { error, redirect } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import { fail, message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { auth } from "$lib/server/auth";
import type { Actions, PageServerLoad } from "./$types";
import { passwordResetConfirmSchema } from "./schema";

export const load: PageServerLoad = async (event) => {
  const token = event.url.searchParams.get("token");
  if (!token) {
    return error(400, "Missing reset token");
  }
  return {
    form: await superValidate(
      { token, password: "" },
      zod4(passwordResetConfirmSchema),
      { errors: false },
    ),
  };
};

export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event, zod4(passwordResetConfirmSchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    const { token, password } = form.data;

    try {
      await auth.api.resetPassword({
        body: { newPassword: password, token },
      });
    } catch (err) {
      if (err instanceof APIError) {
        return message(form, err.message || "Could not reset password", {
          status: 400,
        });
      }
      return message(form, "Unexpected error", { status: 500 });
    }

    return redirect(302, "/login");
  },
};
