import { error, json } from "@sveltejs/kit";
import { signUpload } from "$lib/server/s3";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) error(401, "Unauthorized");

  const { filename, contentType } = (await request.json()) as {
    filename?: string;
    contentType?: string;
  };

  if (!filename) error(400, "filename required");
  if (!contentType?.startsWith("image/")) {
    error(400, "Only image uploads are allowed");
  }

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `mietobjekte/${crypto.randomUUID()}/${safeName}`;
  const url = await signUpload(key, contentType);

  return json({ method: "PUT", url, key });
};
