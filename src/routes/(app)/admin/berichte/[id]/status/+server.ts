import { error, json } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { report } from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

// Lightweight polling endpoint used by the detail page while a report is being
// generated. Returns just the current status, scoped to the active org.
export const GET: RequestHandler = async ({ params, locals }) => {
  const org = locals.activeOrganization;
  if (!org) throw error(403, "Keine aktive Organisation");

  const [row] = await db
    .select({ status: report.status })
    .from(report)
    .where(and(eq(report.id, params.id), eq(report.organizationId, org.id)))
    .limit(1);

  if (!row) throw error(404, "Bericht nicht gefunden");

  return json({ status: row.status });
};
