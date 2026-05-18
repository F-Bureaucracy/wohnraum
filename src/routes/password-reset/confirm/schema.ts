import { z } from "zod";

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(12),
});

export type FormSchema = typeof passwordResetConfirmSchema;
