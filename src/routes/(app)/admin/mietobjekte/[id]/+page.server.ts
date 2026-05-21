import {
  loadMietobjektBewohner,
  loadMietobjektDetail,
} from "$lib/server/mietobjekt-mapping";
import { getBookmarkedIds, toggleBookmarkAction } from "$lib/server/bookmarks";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  const [mietobjekt, bewohner] = await Promise.all([
    loadMietobjektDetail(params.id),
    loadMietobjektBewohner(params.id),
  ]);

  const bookmarked = locals.user
    ? (await getBookmarkedIds(locals.user.id, "mietobjekt")).has(params.id)
    : false;

  return { mietobjekt, bewohner, bookmarked };
};

export const actions: Actions = {
  toggleBookmark: toggleBookmarkAction,
};
