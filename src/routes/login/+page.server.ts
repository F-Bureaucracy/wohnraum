import { redirect } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import { fail, message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { auth } from "$lib/server/auth";
import type { Actions, PageServerLoad } from "./$types";
import { loginSchema } from "./schema";

function safeRedirectTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export const load: PageServerLoad = async (event) => {
  if (event.locals.user) {
    return redirect(
      302,
      safeRedirectTo(event.url.searchParams.get("redirectTo")),
    );
  }
  return { form: await superValidate(zod4(loginSchema)) };
};

export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event, zod4(loginSchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    const { email, password } = form.data;

    try {
      await auth.api.signInEmail({
        body: {
          email,
          password,
          callbackURL: "/auth/verification-success",
        },
      });
    } catch (error) {
      if (error instanceof APIError) {
        return message(form, error.message || "Signin failed", {
          status: 400,
        });
      }
      return message(form, "Unexpected error", { status: 500 });
    }

    return redirect(
      302,
      safeRedirectTo(event.url.searchParams.get("redirectTo")),
    );
  },
};
