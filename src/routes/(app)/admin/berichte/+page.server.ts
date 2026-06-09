import { error, fail, redirect } from "@sveltejs/kit";
import { desc, eq } from "drizzle-orm";
import { DEMO_AI_FEATURE, isFeatureEnabled } from "$lib/features";
import { db } from "$lib/server/db";
import { report } from "$lib/server/db/schema";
import { getOrgFeatures } from "$lib/server/org-settings";
import { generateReport } from "$lib/server/reports";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const org = locals.activeOrganization;
  if (!org) throw error(403, "Keine aktive Organisation");

  const rows = await db
    .select({
      id: report.id,
      prompt: report.prompt,
      status: report.status,
      createdAt: report.createdAt,
    })
    .from(report)
    .where(eq(report.organizationId, org.id))
    .orderBy(desc(report.createdAt));

  return { berichte: rows };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const org = locals.activeOrganization;
    if (!org) throw error(403, "Keine aktive Organisation");

    const form = await request.formData();
    const prompt = String(form.get("prompt") ?? "").trim();
    if (prompt.length === 0) {
      return fail(400, { error: "Bitte geben Sie einen Prompt ein." });
    }

    const [row] = await db
      .insert(report)
      .values({
        organizationId: org.id,
        createdById: locals.user?.id ?? null,
        prompt,
      })
      .returning({ id: report.id });

    const features = await getOrgFeatures(org.id);
    const demo = isFeatureEnabled(features, DEMO_AI_FEATURE);

    // Fire-and-forget: generation runs in the background while the user is sent
    // to the detail page, which polls until the report is ready.
    void generateReport(row.id, prompt, { demo });

    throw redirect(303, `/admin/berichte/${row.id}`);
  },
};
