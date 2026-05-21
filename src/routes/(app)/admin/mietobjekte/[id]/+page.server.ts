import {
  loadMietobjektBewohner,
  loadMietobjektDetail,
} from "$lib/server/mietobjekt-mapping";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const [mietobjekt, bewohner] = await Promise.all([
    loadMietobjektDetail(params.id),
    loadMietobjektBewohner(params.id),
  ]);
  return { mietobjekt, bewohner };
};
