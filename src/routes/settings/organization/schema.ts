import { z } from "zod";

export const organizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug may only contain lowercase letters, numbers, and hyphens",
    ),
  logo: z
    .url("Enter a valid image URL")
    .optional()
    .or(z.literal(""))
    .default(""),
});

export type OrganizationFormSchema = typeof organizationSchema;
