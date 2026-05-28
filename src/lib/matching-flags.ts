import type { TableFilter } from "$lib/components/table-filters";

/**
 * A matching filter definition, curated by administration-org admins.
 * Client-safe mirror of the `filterDefinition` DB row.
 */
export type FilterDefinition = {
  key: string;
  label: string;
  mieterLabel: string | null;
  appliesToMietobjekt: boolean;
  appliesToMieter: boolean;
  sortOrder: number;
};

export type FeatureValues = Record<string, boolean>;

export function mietobjektDefs(defs: FilterDefinition[]): FilterDefinition[] {
  return defs.filter((d) => d.appliesToMietobjekt);
}

export function mieterDefs(defs: FilterDefinition[]): FilterDefinition[] {
  return defs.filter((d) => d.appliesToMieter);
}

/** Label shown for the tenant (requirement) side of a filter. */
export function mieterLabel(def: FilterDefinition): string {
  return def.mieterLabel ?? def.label;
}

export function getMietobjektFeatureLabels(
  defs: FilterDefinition[],
  features: FeatureValues | null | undefined,
): string[] {
  const f = features ?? {};
  return mietobjektDefs(defs)
    .filter((def) => f[def.key])
    .map((def) => def.label);
}

export function getMieterRequirementLabels(
  defs: FilterDefinition[],
  features: FeatureValues | null | undefined,
): string[] {
  const f = features ?? {};
  return mieterDefs(defs)
    .filter((def) => f[def.key])
    .map((def) => mieterLabel(def));
}

export function getMietobjektFeatureFilters(
  defs: FilterDefinition[],
): TableFilter[] {
  return mietobjektDefs(defs).map((def) => ({
    type: "boolean",
    columnId: def.key,
    label: def.label,
  }));
}

export function getMieterRequirementFilters(
  defs: FilterDefinition[],
): TableFilter[] {
  return mieterDefs(defs).map((def) => ({
    type: "boolean",
    columnId: def.key,
    label: mieterLabel(def),
  }));
}

export function addMieterRequirementSearchParams(
  params: URLSearchParams,
  defs: FilterDefinition[],
  features: FeatureValues | null | undefined,
) {
  const f = features ?? {};
  for (const def of mieterDefs(defs)) {
    if (f[def.key]) params.set(def.key, "true");
  }
}

/**
 * Keep only the boolean values whose key belongs to a definition applicable to
 * the given side. Used server-side before persisting form input.
 */
export function sanitizeFeatures(
  defs: FilterDefinition[],
  raw: FeatureValues | null | undefined,
  side: "mietobjekt" | "mieter",
): FeatureValues {
  const source = raw ?? {};
  const applicable =
    side === "mietobjekt" ? mietobjektDefs(defs) : mieterDefs(defs);
  const result: FeatureValues = {};
  for (const def of applicable) {
    if (source[def.key]) result[def.key] = true;
  }
  return result;
}
