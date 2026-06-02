import { desc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { mietobjekt, organization } from "$lib/server/db/schema";
import { getBookmarkedIds, toggleBookmarkAction } from "$lib/server/bookmarks";
import { mapMietobjektRow } from "$lib/server/mietobjekt-mapping";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  const vermieterId = url.searchParams.get("vermieterId");
  const query = db
    .select({ mietobjekt, vermieter: organization.name })
    .from(mietobjekt)
    .leftJoin(organization, eq(organization.id, mietobjekt.organizationId))
    .$dynamic();

  if (vermieterId) {
    query.where(eq(mietobjekt.organizationId, vermieterId));
  }

  const rows = await query.orderBy(desc(mietobjekt.createdAt));

  const bookmarked = locals.user
    ? await getBookmarkedIds(locals.user.id, "mietobjekt")
    : new Set<string>();

  return {
    mietobjekte: rows.map((r) => ({
      ...mapMietobjektRow(r.mietobjekt),
      vermieter: r.vermieter,
      bookmarked: bookmarked.has(r.mietobjekt.id),
    })),
  };
};

export const actions: Actions = {
  toggleBookmark: toggleBookmarkAction,
};
