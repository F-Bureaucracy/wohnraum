import { error } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { report } from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

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
