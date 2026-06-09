// Read/write helpers for per-organization feature flags
// (`organizationSettings.features`). The settings row is created lazily on the
// first toggle.

import { eq } from "drizzle-orm";
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
