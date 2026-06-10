// Registry of organization-level feature flags. Shared between the settings UI
// (which renders a toggle per feature) and server code (which reads whether a
// feature is enabled). Flags are stored per organization in
// `organizationSettings.features`, keyed by the `key` below.

export type FeatureFlag = {
  key: string;
  title: string;
  description: string;
};

export const DEMO_AI_FEATURE = "demo-ai";
export const DEMO_IMPORT_FEATURE = "demo-import";

export const FEATURES: FeatureFlag[] = [
  {
    key: DEMO_AI_FEATURE,
    title: "Demo-KI",
    description:
      "Verwendet die Demo-Endpunkte des KI-Berichtsdienstes. Berichte werden mit Beispieldaten erzeugt – ideal für Vorführungen.",
  },
  {
    key: DEMO_IMPORT_FEATURE,
    title: "Demo-Import",
    description:
      "Der Mietobjekt-Importer ignoriert den eingegebenen Link und übernimmt immer die unten hinterlegten Demo-Daten – ideal für Vorführungen, wenn Portale den automatischen Abruf blockieren.",
  },
];

// Demo listing payload returned by the importer when the Demo-Import feature is
// active. Mirrors the importer's `ImportedListing` plus the photo URLs to pull
// in. Stored per (administration) organization in
// `organizationSettings.demoListing` and applied globally — see
// `$lib/server/org-settings`.
export type DemoListing = {
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  livingArea?: number;
  rooms?: number;
  bedrooms?: number;
  coldRent?: number;
  operatingCosts?: number;
  heatingCosts?: number;
  deposit?: number;
  description?: string;
  imageUrls?: string[];
};

const FEATURE_KEYS = new Set(FEATURES.map((f) => f.key));

export function isKnownFeature(key: string): boolean {
  return FEATURE_KEYS.has(key);
}

export function isFeatureEnabled(
  features: Record<string, boolean> | null | undefined,
  key: string,
): boolean {
  return features?.[key] === true;
}
