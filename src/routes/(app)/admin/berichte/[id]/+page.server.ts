import { error, redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { report } from "$lib/server/db/schema";
import { deleteObject } from "$lib/server/s3";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  const org = locals.activeOrganization;
  if (!org) throw error(403, "Keine aktive Organisation");

  const [row] = await db
    .select()
    .from(report)
    .where(and(eq(report.id, params.id), eq(report.organizationId, org.id)))
    .limit(1);

  if (!row) throw error(404, "Bericht nicht gefunden");

  return {
    bericht: {
      id: row.id,
      prompt: row.prompt,
      status: row.status,
      sourceHtml: row.sourceHtml,
      errorMessage: row.errorMessage,
      hasPdf: row.pdfStorageKey !== null,
      createdAt: row.createdAt,
    },
  };
};

export const actions: Actions = {
  delete: async ({ params, locals }) => {
    const org = locals.activeOrganization;
    if (!org) throw error(403, "Keine aktive Organisation");

    const [row] = await db
      .delete(report)
      .where(and(eq(report.id, params.id), eq(report.organizationId, org.id)))
      .returning({ pdfStorageKey: report.pdfStorageKey });

    if (!row) throw error(404, "Bericht nicht gefunden");

    // Best-effort cleanup of the PDF in S3; the row is already gone either way.
    if (row.pdfStorageKey) {
      try {
        await deleteObject(row.pdfStorageKey);
      } catch (err) {
        console.error(`report ${params.id}: PDF cleanup failed`, err);
      }
    }

    throw redirect(303, "/admin/berichte");
  },
};
