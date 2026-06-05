import type { Handle, HandleServerError } from "@sveltejs/kit";
import { building } from "$app/environment";
import { auth } from "$lib/server/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";

const handleBetterAuth: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({ headers: event.request.headers });

  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;

    try {
      let activeOrg = await auth.api
        .getFullOrganization({ headers: event.request.headers })
        .catch(() => null);

      if (!activeOrg) {
        const orgs = await auth.api
          .listOrganizations({ headers: event.request.headers })
          .catch(() => [] as Array<{ id: string }>);
        const first = orgs?.[0];
        if (first) {
          await auth.api.setActiveOrganization({
            headers: event.request.headers,
            body: { organizationId: first.id },
          });
          activeOrg = await auth.api
            .getFullOrganization({ headers: event.request.headers })
            .catch(() => null);
        }
      }

      event.locals.activeOrganization = activeOrg
        ? {
            id: activeOrg.id,
            name: activeOrg.name,
            slug: activeOrg.slug,
            orgType: (activeOrg as { orgType: string }).orgType,
          }
        : null;
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
