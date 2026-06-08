import type { Handle, HandleServerError } from "@sveltejs/kit";
import { building } from "$app/environment";
import { eq } from "drizzle-orm";
import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { organization } from "$lib/server/db/schema";
import { svelteKitHandler } from "better-auth/svelte-kit";

const handleBetterAuth: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({ headers: event.request.headers });

  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;

    try {
      // The active org id lives on the session record (set by the organization
      // plugin), so we get it for free from the already-fetched session — no
      // extra round-trip. We then read only the four fields the app uses with a
      // single lightweight select instead of getFullOrganization, which also
      // pulls members, invitations and teams we never look at here.
      let activeOrgId =
        (session.session as { activeOrganizationId?: string | null })
          .activeOrganizationId ?? null;

      // No active org yet (e.g. first request after sign-up) — pick the user's
      // first org and persist it as active.
      if (!activeOrgId) {
        const orgs = await auth.api
          .listOrganizations({ headers: event.request.headers })
          .catch(() => [] as Array<{ id: string }>);
        const first = orgs?.[0];
        if (first) {
          await auth.api.setActiveOrganization({
            headers: event.request.headers,
            body: { organizationId: first.id },
          });
          activeOrgId = first.id;
        }
      }

      const [activeOrg] = activeOrgId
        ? await db
            .select({
              id: organization.id,
              name: organization.name,
              slug: organization.slug,
              orgType: organization.orgType,
            })
            .from(organization)
            .where(eq(organization.id, activeOrgId))
            .limit(1)
        : [];

      event.locals.activeOrganization = activeOrg ?? null;
    } catch (err) {
      console.error("[hooks] failed to load active organization", err);
      event.locals.activeOrganization = null;
    }
  }

  return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;

export const handleError: HandleServerError = ({ error, event }) => {
  console.error(
    `[handleError] ${event.request.method} ${event.url.pathname}`,
    error,
  );
};
