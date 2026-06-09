import { error, redirect } from "@sveltejs/kit";
import { signDownload } from "$lib/server/s3";
import type { RequestHandler } from "./$types";

// Preview for images that have been uploaded to storage but not yet persisted
// as a mietobjekt image (e.g. freshly chosen or imported photos on the create
// form). Access is limited to authenticated users and to the mietobjekte/
// prefix; the keys themselves are unguessable random UUIDs.
export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) error(401, "Unauthorized");

  const key = url.searchParams.get("key");
  if (!key || !key.startsWith("mietobjekte/")) {
    error(400, "Ungültiger Schlüssel");
  }

  const signed = await signDownload(key);
  redirect(302, signed);
};
