import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { organization } from "better-auth/plugins";
import { env } from "$env/dynamic/private";
import { getRequestEvent } from "$app/server";
import { db } from "$lib/server/db";
import { auditLog } from "better-auth-audit-logs";
import { sendEmail } from "$lib/server/email";

import { organization as organizationTable } from "$lib/server/db/auth.schema";

import { eq, like, or } from "drizzle-orm";

function slugify(value: string | null | undefined): string {
  const slug = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "organisation";
}

async function findAvailableSlug(baseSlug: string): Promise<string> {
  const existing = await db
    .select({ slug: organizationTable.slug })
    .from(organizationTable)
    .where(
      or(
        eq(organizationTable.slug, baseSlug),
        like(organizationTable.slug, `${baseSlug}%`),
      ),
    );
  const taken = new Set(existing.map((o) => o.slug));
  if (!taken.has(baseSlug)) return baseSlug;
  let n = 1;
  while (taken.has(`${baseSlug}${n}`)) n += 1;
  return `${baseSlug}${n}`;
}

export const auth = betterAuth({
  baseURL: env.ORIGIN,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg" }),
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
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const slug = await findAvailableSlug(slugify(user.name));
          await auth.api.createOrganization({
            body: {
              name: user.name,
              slug,
              userId: user.id,
              orgType: "company",
            },
          });
        },
      },
    },
  },
  plugins: [
    auditLog(),
    organization({
      teams: {
        enabled: true,
      },
      async sendInvitationEmail(data) {
        const inviteLink = `${env.ORIGIN}/accept-invitation/${data.id}`;
        const orgName = data.organization.name;
        const inviterName = data.inviter.user.name ?? data.inviter.user.email;
        await sendEmail({
          to: data.email,
          subject: `Einladung zu ${orgName}`,
          text: `${inviterName} hat Sie zu ${orgName} eingeladen.\n\nEinladung annehmen:\n${inviteLink}\n\nWenn Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.`,
          html: `<p>${inviterName} hat Sie zu <strong>${orgName}</strong> eingeladen.</p><p><a href="${inviteLink}">Einladung annehmen</a></p><p>Wenn Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.</p>`,
        });
      },
      schema: {
        organization: {
          additionalFields: {
            orgType: {
              type: "string",
              required: true,
            },
          },
        },
      },
      organizationHooks: {
        beforeCreateOrganization: async ({ organization, user }) => {
          if (
            organization.orgType === "administration" &&
            user.role !== "super_admin"
          ) {
            throw new Error(
              "Unauthorized to create public administration organizations",
            );
          }
          return { data: organization };
        },
      },
    }),
    sveltekitCookies(getRequestEvent), // make sure this is the last plugin in the array
  ],
});
