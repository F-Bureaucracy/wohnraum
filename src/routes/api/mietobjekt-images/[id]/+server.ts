import { error, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { mietobjekt, mietobjektImage } from "$lib/server/db/schema";
import { signDownload } from "$lib/server/s3";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) error(401, "Unauthorized");

  const [row] = await db
    .select({
      fileName: mietobjektImage.fileName,
      storageKey: mietobjektImage.storageKey,
      organizationId: mietobjekt.organizationId,
    })
    .from(mietobjektImage)
    .innerJoin(mietobjekt, eq(mietobjekt.id, mietobjektImage.mietobjektId))
    .where(eq(mietobjektImage.id, params.id))
    .limit(1);

  if (!row) error(404, "Bild nicht gefunden");

  const activeOrg = locals.activeOrganization;
  const canAccess =
    activeOrg?.orgType === "administration" ||
    activeOrg?.id === row.organizationId;
  if (!canAccess) error(403, "Nicht erlaubt");

  const url = await signDownload(row.storageKey, row.fileName);
  redirect(302, url);
};
