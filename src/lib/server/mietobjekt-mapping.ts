import type { mietobjekt } from "$lib/server/db/schema";
import type { Mietobjekt } from "$lib/components/columns-mietobjekte";

type Row = typeof mietobjekt.$inferSelect;

export function mapMietobjektRow(r: Row): Mietobjekt {
  return {
    id: r.id,
    adresse: `${r.street} ${r.houseNumber}, ${r.postalCode} ${r.city}`,
    zimmer: r.rooms,
    flaeche: r.livingArea,
    kaltmiete: r.coldRentCents / 100,
    createdAt: r.createdAt,
  };
}
