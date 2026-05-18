import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { env } from "$env/dynamic/private";
import { getRequestEvent } from "$app/server";
import { db } from "$lib/server/db";
import { auditLog } from "better-auth-audit-logs";
import { sendEmail } from "$lib/server/email";

export const auth = betterAuth({
  baseURL: env.ORIGIN,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Hi ${user.name ?? ""},\n\nReset your password by visiting:\n${url}\n\nIf you didn't request this, you can ignore this email.`,
        html: `<p>Hi ${user.name ?? ""},</p><p>Reset your password by visiting <a href="${url}">${url}</a>.</p><p>If you didn't request this, you can ignore this email.</p>`,
      });
    },
  },
  plugins: [
    auditLog(),
    sveltekitCookies(getRequestEvent), // make sure this is the last plugin in the array
  ],
});
