import { error, redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { report } from "$lib/server/db/schema";
import { signDownload } from "$lib/server/s3";
import type { RequestHandler } from "./$types";

// Redirects to a short-lived signed URL for the report's PDF in our S3 bucket.
export const GET: RequestHandler = async ({ params, locals }) => {
  const org = locals.activeOrganization;
  if (!org) throw error(403, "Keine aktive Organisation");

  const [row] = await db
    .select({ pdfStorageKey: report.pdfStorageKey })
    .from(report)
    .where(and(eq(report.id, params.id), eq(report.organizationId, org.id)))
    .limit(1);

  if (!row) throw error(404, "Bericht nicht gefunden");
  if (!row.pdfStorageKey) throw error(404, "Kein PDF verfügbar");

  const url = await signDownload(row.pdfStorageKey, `bericht-${params.id}.pdf`);
  throw redirect(302, url);
};
