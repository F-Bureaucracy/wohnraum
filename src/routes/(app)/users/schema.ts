import { z } from "zod";

export const inviteMemberSchema = z.object({
  email: z.string().min(1, "E-Mail ist erforderlich").email("Ungültige E-Mail"),
  role: z.enum(["member", "admin"]).default("member"),
});

export type InviteMemberSchema = typeof inviteMemberSchema;
