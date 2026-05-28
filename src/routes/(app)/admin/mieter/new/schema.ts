import { z } from "zod";

export const mieterSchema = z.object({
  firstName: z.string().min(1, "Vorname erforderlich"),
  lastName: z.string().min(1, "Nachname erforderlich"),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum erforderlich")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["female", "male", "diverse", "unspecified"]).optional(),

  email: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
  phone: z.string().optional(),

  householdSize: z.number().int().positive("Mind. 1 Person"),
  maxColdRent: z.number().nonnegative().optional(),

  // Admin-defined boolean matching requirements, keyed by filterDefinition.key.
  features: z.record(z.string(), z.boolean()).default({}),

  availableFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum erforderlich")
    .optional()
    .or(z.literal("")),

  notes: z.string().optional(),
});

export type FormSchema = typeof mieterSchema;
