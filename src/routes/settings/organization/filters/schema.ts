import { z } from "zod";

export const filterSchema = z
  .object({
    // Empty when creating, set to the existing key when editing.
    key: z.string().default(""),
    label: z.string().min(1, "Bezeichnung erforderlich"),
    mieterLabel: z.string().optional().default(""),
    appliesToMietobjekt: z.boolean().default(true),
    appliesToMieter: z.boolean().default(false),
  })
  .refine((d) => d.appliesToMietobjekt || d.appliesToMieter, {
    message: "Mindestens ein Bereich muss ausgewählt sein",
    path: ["appliesToMietobjekt"],
  });

export type FilterFormSchema = typeof filterSchema;
