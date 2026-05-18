import { fail } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { auth } from "$lib/server/auth";
import type { Actions, PageServerLoad } from "./$types";
import { emailSchema, passwordSchema, profileSchema } from "./schema";

const formIds = {
  // Superforms needs stable IDs to isolate state between multiple forms on one route.
  profile: "user-profile",
  email: "user-email",
  password: "user-password",
};

export const load: PageServerLoad = async (event) => {
  const user = event.locals.user!;

  return {
    profileForm: await superValidate(
      { name: user.name, image: user.image ?? "" },
      zod4(profileSchema),
      { id: formIds.profile },
    ),
    emailForm: await superValidate({ email: user.email }, zod4(emailSchema), {
      id: formIds.email,
    }),
    passwordForm: await superValidate(zod4(passwordSchema), {
      id: formIds.password,
    }),
  };
};

export const actions: Actions = {
  updateProfile: async (event) => {
    const form = await superValidate(event, zod4(profileSchema), {
      id: formIds.profile,
    });
    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await auth.api.updateUser({
        headers: event.request.headers,
        body: {
          name: form.data.name,
          image: form.data.image || null,
        },
      });
    } catch (error) {
      return message(
        form,
        getAuthErrorMessage(error, "Profile update failed"),
        { status: 400 },
      );
    }

    return message(form, "Profile updated");
  },

  updateEmail: async (event) => {
    const form = await superValidate(event, zod4(emailSchema), {
      id: formIds.email,
    });
    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await auth.api.changeEmail({
        headers: event.request.headers,
        body: {
          newEmail: form.data.email,
        },
      });
    } catch (error) {
      return message(form, getAuthErrorMessage(error, "Email update failed"), {
        status: 400,
      });
    }

    return message(form, "Email updated");
  },

  updatePassword: async (event) => {
    const form = await superValidate(event, zod4(passwordSchema), {
      id: formIds.password,
    });
    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await auth.api.changePassword({
        headers: event.request.headers,
        body: {
          currentPassword: form.data.currentPassword,
          newPassword: form.data.newPassword,
          revokeOtherSessions: true,
        },
      });
    } catch (error) {
      return message(
        form,
        getAuthErrorMessage(error, "Password update failed"),
        { status: 400 },
      );
    }

    return message(form, "Password updated");
  },
};

function getAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof APIError) {
    return error.message || fallback;
  }
  return fallback;
}
