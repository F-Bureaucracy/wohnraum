import { error, redirect, type RequestHandler } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import { auth } from "$lib/server/auth";

export const POST: RequestHandler = async (event) => {
  if (!event.locals.user) throw error(401, "Nicht angemeldet");

  const formData = await event.request.formData();
  const invitationId = String(formData.get("invitationId") ?? "");
  if (!invitationId) throw error(400, "Einladung fehlt");

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

  const returnTo = event.request.headers.get("referer") ?? "/";
  throw redirect(303, returnTo);
};
