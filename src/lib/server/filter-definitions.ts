import { asc } from "drizzle-orm";
import { db } from "$lib/server/db";
import { filterDefinition } from "$lib/server/db/schema";
import type { FilterDefinition } from "$lib/matching-flags";

/** Load the global, admin-curated matching filter definitions, ordered for display. */
export async function loadFilterDefinitions(): Promise<FilterDefinition[]> {
  const rows = await db
    .select({
      key: filterDefinition.key,
      label: filterDefinition.label,
      mieterLabel: filterDefinition.mieterLabel,
      appliesToMietobjekt: filterDefinition.appliesToMietobjekt,
      appliesToMieter: filterDefinition.appliesToMieter,
      sortOrder: filterDefinition.sortOrder,
    })
    .from(filterDefinition)
    .orderBy(asc(filterDefinition.sortOrder), asc(filterDefinition.label));
  return rows;
}
