import { desc } from "drizzle-orm";
import { db } from "$lib/server/db";
import { mietobjekt } from "$lib/server/db/schema";
import { getBookmarkedIds, toggleBookmarkAction } from "$lib/server/bookmarks";
import { mapMietobjektRow } from "$lib/server/mietobjekt-mapping";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const rows = await db
    .select()
    .from(mietobjekt)
    .orderBy(desc(mietobjekt.createdAt));

  const bookmarked = locals.user
    ? await getBookmarkedIds(locals.user.id, "mietobjekt")
    : new Set<string>();

  return {
    mietobjekte: rows.map((r) => ({
      ...mapMietobjektRow(r),
      bookmarked: bookmarked.has(r.id),
    })),
  };
};

export const actions: Actions = {
  toggleBookmark: toggleBookmarkAction,
};
