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

export const FEATURES: FeatureFlag[] = [
  {
    key: DEMO_AI_FEATURE,
    title: "Demo-KI",
    description:
      "Verwendet die Demo-Endpunkte des KI-Berichtsdienstes. Berichte werden mit Beispieldaten erzeugt – ideal für Vorführungen.",
  },
];

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
