import type { TableFilter } from "$lib/components/table-filters";

export const mietobjektFeatureFlags = [
  {
    mietobjektField: "barrierFree",
    mieterField: "needsBarrierFree",
    mietobjektLabel: "Barrierefrei",
    mieterLabel: "Barrierefrei benötigt",
    filterLabel: "Barrierefrei",
    mieterFilterLabel: "Barrierefrei benötigt",
  },
  {
    mietobjektField: "petsAllowed",
    mieterField: "hasPets",
    mietobjektLabel: "Haustiere erlaubt",
    mieterLabel: "Haustiere",
    filterLabel: "Haustiere erlaubt",
    mieterFilterLabel: "Hat Haustiere",
  },
  {
    mietobjektField: "hasKitchen",
    mietobjektLabel: "Einbauküche",
    filterLabel: "Einbauküche",
  },
  {
    mietobjektField: "hasBalcony",
    mietobjektLabel: "Balkon",
    filterLabel: "Balkon",
  },
] as const;

export const matchingRequirementFlags = mietobjektFeatureFlags.filter(
  (flag): flag is Extract<MietobjektFeatureFlag, { mieterField: string }> =>
    "mieterField" in flag,
);

export const mietobjektAmenityFlags = mietobjektFeatureFlags.filter(
  (flag): flag is Exclude<MietobjektFeatureFlag, { mieterField: string }> =>
    !("mieterField" in flag),
);

export type MietobjektFeatureFlag = (typeof mietobjektFeatureFlags)[number];
export type MietobjektFeatureField = MietobjektFeatureFlag["mietobjektField"];
export type MieterRequirementField =
  (typeof matchingRequirementFlags)[number]["mieterField"];

type MietobjektFeatureValues = Partial<Record<MietobjektFeatureField, boolean>>;
type MieterRequirementValues = Partial<Record<MieterRequirementField, boolean>>;

export function getMietobjektFeatureValues(
  source: Record<MietobjektFeatureField, boolean>,
): Record<MietobjektFeatureField, boolean> {
  return Object.fromEntries(
    mietobjektFeatureFlags.map((flag) => [
      flag.mietobjektField,
      source[flag.mietobjektField],
    ]),
  ) as Record<MietobjektFeatureField, boolean>;
}

export function getMietobjektFeatureLabels(
  mietobjekt: MietobjektFeatureValues,
): string[] {
  return mietobjektFeatureFlags
    .filter((flag) => mietobjekt[flag.mietobjektField])
    .map((flag) => flag.mietobjektLabel);
}

export function getMieterRequirementLabels(
  mieter: MieterRequirementValues,
): string[] {
  return matchingRequirementFlags
    .filter((flag) => mieter[flag.mieterField])
    .map((flag) => flag.mieterLabel);
}

export function getMietobjektFeatureFilters(): TableFilter[] {
  return mietobjektFeatureFlags.map((flag) => ({
    type: "boolean",
    columnId: flag.mietobjektField,
    label: flag.filterLabel,
  }));
}

export function getMieterRequirementFilters(): TableFilter[] {
  return matchingRequirementFlags.map((flag) => ({
    type: "boolean",
    columnId: flag.mieterField,
    label: flag.mieterFilterLabel,
  }));
}

export function addMieterRequirementSearchParams(
  params: URLSearchParams,
  mieter: MieterRequirementValues,
) {
  for (const flag of matchingRequirementFlags) {
    if (mieter[flag.mieterField]) {
      params.set(flag.mietobjektField, "true");
    }
  }
}
