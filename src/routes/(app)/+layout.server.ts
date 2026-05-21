import { redirect } from "@sveltejs/kit";
import { and, desc, eq } from "drizzle-orm";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import {
  invitation,
  organization,
  user as userTable,
} from "$lib/server/db/schema";
import { createOrganizationSchema } from "./organizations/schema";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async (event) => {
  if (!event.locals.user) {
    throw redirect(302, "/login");
  }

  const orgs = await auth.api
    .listOrganizations({ headers: event.request.headers })
    .catch(() => [] as Array<{ id: string; name: string; slug: string }>);

  const createOrganizationForm = await superValidate(
    zod4(createOrganizationSchema),
  );
  const activeMember = await auth.api
    .getActiveMember({ headers: event.request.headers })
    .catch(() => null);
  const role = activeMember?.role ?? "";
  const canViewOrgInvitations = role === "owner" || role === "admin";
  const activeOrg = event.locals.activeOrganization ?? null;

  const [incomingInvitations, organizationInvitations] = await Promise.all([
    db
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        organizationName: organization.name,
        inviterName: userTable.name,
      })
      .from(invitation)
      .innerJoin(organization, eq(organization.id, invitation.organizationId))
      .leftJoin(userTable, eq(userTable.id, invitation.inviterId))
      .where(
        and(
          eq(invitation.email, event.locals.user.email),
          eq(invitation.status, "pending"),
        ),
      )
      .orderBy(desc(invitation.createdAt))
      .limit(5),
    canViewOrgInvitations && activeOrg
      ? db
          .select({
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            expiresAt: invitation.expiresAt,
            createdAt: invitation.createdAt,
            organizationName: organization.name,
            inviterName: userTable.name,
          })
          .from(invitation)
          .innerJoin(organization, eq(organization.id, invitation.organizationId))
          .leftJoin(userTable, eq(userTable.id, invitation.inviterId))
          .where(
            and(
              eq(invitation.organizationId, activeOrg.id),
              eq(invitation.status, "pending"),
            ),
          )
          .orderBy(desc(invitation.createdAt))
          .limit(5)
      : Promise.resolve([]),
  ]);

  const notifications = [
    ...incomingInvitations.map((item) => ({
      ...item,
      type: "incoming-invitation" as const,
    })),
    ...organizationInvitations
      .filter((item) => !incomingInvitations.some((incoming) => incoming.id === item.id))
      .map((item) => ({
        ...item,
        type: "organization-invitation" as const,
      })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  return {
    user: event.locals.user,
    activeOrganization: activeOrg,
    organizations: orgs.map((o) => ({ id: o.id, name: o.name, slug: o.slug })),
    createOrganizationForm,
    canViewAuditLog: canViewOrgInvitations,
    notifications,
  };
};
