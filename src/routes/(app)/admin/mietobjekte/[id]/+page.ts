import { error } from "@sveltejs/kit";
import { getMietobjekt } from "$lib/data/mietobjekte";
import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params }) => {
  const mietobjekt = getMietobjekt(params.id);
  if (!mietobjekt) {
    error(404, "Mietobjekt nicht gefunden");
  }
  return { mietobjekt };
};
