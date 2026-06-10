// Read/write helpers for per-organization feature flags
// (`organizationSettings.features`). The settings row is created lazily on the
// first toggle.

import { eq, sql } from "drizzle-orm";
import { DEMO_IMPORT_FEATURE, type DemoListing } from "$lib/features";
import { db } from "./db";
import { organizationSettings } from "./db/schema";

export async function getOrgFeatures(
  organizationId: string,
): Promise<Record<string, boolean>> {
  const [row] = await db
    .select({ features: organizationSettings.features })
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, organizationId))
    .limit(1);
  return row?.features ?? {};
}

export async function setOrgFeature(
  organizationId: string,
  key: string,
  enabled: boolean,
): Promise<void> {
  const features = {
    ...(await getOrgFeatures(organizationId)),
    [key]: enabled,
  };
  await db
    .insert(organizationSettings)
    .values({ organizationId, features })
    .onConflictDoUpdate({
      target: organizationSettings.organizationId,
      set: { features, updatedAt: new Date() },
    });
}

export async function getDemoListing(
  organizationId: string,
): Promise<DemoListing | null> {
  const [row] = await db
    .select({ demoListing: organizationSettings.demoListing })
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, organizationId))
    .limit(1);
  return row?.demoListing ?? null;
}

export async function setDemoListing(
  organizationId: string,
  demoListing: DemoListing,
): Promise<void> {
  await db
    .insert(organizationSettings)
    .values({ organizationId, demoListing })
    .onConflictDoUpdate({
      target: organizationSettings.organizationId,
      set: { demoListing, updatedAt: new Date() },
    });
}

// Demo-Import is a global, presentation-only switch: whichever (administration)
// organization enabled it and stored demo data wins, regardless of which org is
// running the importer. Returns null when no org has the feature on with data.
export async function getActiveDemoListing(): Promise<DemoListing | null> {
  const [row] = await db
    .select({ demoListing: organizationSettings.demoListing })
    .from(organizationSettings)
    .where(
      sql`${organizationSettings.features} ->> ${DEMO_IMPORT_FEATURE} = 'true'`,
    )
    .limit(1);
  return row?.demoListing ?? null;
}
