import { and, eq, isNull } from "drizzle-orm";
import { error } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { mieter } from "$lib/server/db/schema";
import {
  loadMietobjektBewohner,
  loadMietobjektDetail,
} from "$lib/server/mietobjekt-mapping";
import { getBookmarkedIds, toggleBookmarkAction } from "$lib/server/bookmarks";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  const activeOrg = locals.activeOrganization;

  const [mietobjekt, bewohner, assignable] = await Promise.all([
    loadMietobjektDetail(params.id),
    loadMietobjektBewohner(params.id),
    activeOrg
      ? db
          .select({
            id: mieter.id,
            firstName: mieter.firstName,
            lastName: mieter.lastName,
          })
          .from(mieter)
          .where(
            and(
              eq(mieter.organizationId, activeOrg.id),
              isNull(mieter.mietobjektId),
            ),
          )
          .orderBy(mieter.lastName, mieter.firstName)
      : Promise.resolve([]),
  ]);

  const [mietobjektBookmarks, mieterBookmarks] = locals.user
    ? await Promise.all([
        getBookmarkedIds(locals.user.id, "mietobjekt"),
        getBookmarkedIds(locals.user.id, "mieter"),
      ])
    : [new Set<string>(), new Set<string>()];

  return {
    mietobjekt,
    bewohner,
    bookmarked: mietobjektBookmarks.has(params.id),
    assignableMieter: assignable.map((r) => ({
      id: r.id,
      name: `${r.firstName} ${r.lastName}`,
      bookmarked: mieterBookmarks.has(r.id),
    })),
  };
};

export const actions: Actions = {
  toggleBookmark: toggleBookmarkAction,

  assignMieter: async (event) => {
    const activeOrg = event.locals.activeOrganization;
    if (activeOrg?.orgType !== "administration") {
      throw error(403, "Nur Administration");
    }

    const data = await event.request.formData();
    const mieterId = String(data.get("mieterId") ?? "");
    if (!mieterId) throw error(400, "Kein Mieter ausgewählt");

    const result = await db
      .update(mieter)
      .set({ mietobjektId: event.params.id })
      .where(
        and(eq(mieter.id, mieterId), eq(mieter.organizationId, activeOrg.id)),
      )
      .returning({ id: mieter.id });

    if (result.length === 0) throw error(404, "Mieter nicht gefunden");

    return { success: true };
  },

  unassignMieter: async (event) => {
    const activeOrg = event.locals.activeOrganization;
    if (activeOrg?.orgType !== "administration") {
      throw error(403, "Nur Administration");
    }

    const data = await event.request.formData();
    const mieterId = String(data.get("mieterId") ?? "");
    if (!mieterId) throw error(400, "Kein Mieter ausgewählt");

    const result = await db
      .update(mieter)
      .set({ mietobjektId: null })
      .where(
        and(
          eq(mieter.id, mieterId),
          eq(mieter.organizationId, activeOrg.id),
          eq(mieter.mietobjektId, event.params.id),
        ),
      )
      .returning({ id: mieter.id });

    if (result.length === 0) throw error(404, "Mieter nicht gefunden");

    return { success: true };
  },
};
