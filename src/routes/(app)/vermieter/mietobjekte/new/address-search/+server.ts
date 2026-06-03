import { json } from "@sveltejs/kit";
import { searchAddressSuggestions } from "$lib/server/geocode";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.user) {
    return json({ suggestions: [] }, { status: 401 });
  }

  const query = url.searchParams.get("q") ?? "";
  const suggestions = await searchAddressSuggestions(query);
  return json({ suggestions });
};
