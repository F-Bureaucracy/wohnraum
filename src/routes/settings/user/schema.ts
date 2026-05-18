import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  image: z
    .url("Enter a valid image URL")
    .optional()
    .or(z.literal(""))
    .default(""),
});

export const emailSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(12, "Password must be at least 12 characters long"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type ProfileFormSchema = typeof profileSchema;
export type EmailFormSchema = typeof emailSchema;
export type PasswordFormSchema = typeof passwordSchema;
