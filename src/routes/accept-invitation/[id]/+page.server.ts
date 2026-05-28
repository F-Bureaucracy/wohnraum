import { error, redirect } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import { auth } from "$lib/server/auth";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const invitationId = event.params.id;
  if (!event.locals.user) {
    const redirectTo = `/accept-invitation/${encodeURIComponent(invitationId)}`;
    throw redirect(302, `/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  try {
    await auth.api.acceptInvitation({
      headers: event.request.headers,
      body: { invitationId },
    });
  } catch (err) {
    if (err instanceof APIError) {
      throw error(err.statusCode ?? 400, err.message);
    }
    throw error(500, "Einladung konnte nicht angenommen werden");
  }

  throw redirect(303, "/");
};
