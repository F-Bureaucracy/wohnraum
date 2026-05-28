import { z } from "zod";

export const mietobjektSchema = z.object({
  organizationId: z.string().min(1, "Organisation erforderlich"),

  street: z.string().min(1, "Straße erforderlich"),
  houseNumber: z.string().min(1, "Hausnummer erforderlich"),
  postalCode: z.string().regex(/^\d{5}$/, "PLZ muss 5 Ziffern haben"),
  city: z.string().min(1, "Stadt erforderlich"),
  floor: z.string().optional(),
  unit: z.string().optional(),

  livingArea: z.number().int().positive("Wohnfläche muss > 0 sein"),
  rooms: z.number().int().positive("Anzahl Zimmer muss > 0 sein"),
  bedrooms: z.number().int().nonnegative().optional(),

  coldRent: z.number().nonnegative("Kaltmiete muss ≥ 0 sein"),
  operatingCosts: z.number().nonnegative().default(0),
  heatingCosts: z.number().nonnegative().default(0),
  deposit: z.number().nonnegative().default(0),

  availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum erforderlich"),
  minLeaseMonths: z.number().int().positive().optional(),

  maxOccupants: z.number().int().positive("Max. Bewohner muss > 0 sein"),

  // Admin-defined boolean matching features, keyed by filterDefinition.key.
  features: z.record(z.string(), z.boolean()).default({}),

  description: z.string().optional(),
});

export type FormSchema = typeof mietobjektSchema;
