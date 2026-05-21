import { error, redirect } from "@sveltejs/kit";
import { and, asc, desc, eq } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { fail, message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { invitation, member, user } from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";
import { inviteMemberSchema } from "./schema";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, "/login");
  const activeOrg = locals.activeOrganization;
  if (!activeOrg) throw error(403, "Keine aktive Organisation");

  const [rows, invitations] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: member.role,
        joinedAt: member.createdAt,
      })
      .from(member)
      .innerJoin(user, eq(user.id, member.userId))
      .where(eq(member.organizationId, activeOrg.id))
      .orderBy(asc(user.name)),
    db
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        inviterName: user.name,
      })
      .from(invitation)
      .leftJoin(user, eq(user.id, invitation.inviterId))
      .where(
        and(
          eq(invitation.organizationId, activeOrg.id),
          eq(invitation.status, "pending"),
        ),
      )
      .orderBy(desc(invitation.createdAt)),
  ]);

  return {
    users: rows,
    invitations,
    organizationName: activeOrg.name,
    inviteForm: await superValidate(zod4(inviteMemberSchema)),
  };
};

export const actions: Actions = {
  inviteMember: async (event) => {
    if (!event.locals.user) throw redirect(302, "/login");
    const form = await superValidate(event, zod4(inviteMemberSchema));
    if (!form.valid) return fail(400, { form });

    try {
      await auth.api.createInvitation({
        headers: event.request.headers,
        body: {
          email: form.data.email,
          role: form.data.role,
        },
      });
    } catch (err) {
      if (err instanceof APIError) {
        return message(
          form,
          err.message || "Einladung konnte nicht erstellt werden",
          { status: 400 },
        );
      }
      return message(form, "Unerwarteter Fehler", { status: 500 });
    }

    return message(form, "Einladung wurde versendet");
  },
};
