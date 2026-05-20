import { loadMietobjektDetail } from "$lib/server/mietobjekt-mapping";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  return { mietobjekt: await loadMietobjektDetail(params.id) };
};
