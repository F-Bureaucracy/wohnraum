import type { Mietobjekt } from "$lib/components/columns-mietobjekte";

export type MietobjektDetail = Mietobjekt & {
  vermieter: string;
  mieter: string | null;
  baujahr: number;
  etage: string;
  heizung: string;
  nebenkosten: number;
  kaution: number;
  beschreibung: string;
};

export const mietobjekte: MietobjektDetail[] = [
  {
    id: "o1",
    adresse: "Heger Straße 12, 49074 Osnabrück",
    zimmer: 3,
    flaeche: 78,
    kaltmiete: 920,
    lng: 8.0421,
    lat: 52.2782,
    createdAt: new Date("2023-08-15"),
    vermieter: "Klaus Hoffmann",
    mieter: "Familie Müller",
    baujahr: 1958,
    etage: "2. OG",
    heizung: "Gas-Zentralheizung",
    nebenkosten: 180,
    kaution: 2760,
    beschreibung:
      "Charmante Altbauwohnung in zentraler Lage mit Stuckdecken und Dielenboden. Balkon zum ruhigen Innenhof.",
  },
  {
    id: "o2",
    adresse: "Großhandelsring 4, 49084 Osnabrück",
    zimmer: 2,
    flaeche: 56,
    kaltmiete: 680,
    lng: 8.0721,
    lat: 52.2691,
    createdAt: new Date("2024-01-22"),
    vermieter: "Sabine Wagner",
    mieter: "Jonas Krüger",
    baujahr: 1995,
    etage: "EG",
    heizung: "Fernwärme",
    nebenkosten: 140,
    kaution: 2040,
    beschreibung:
      "Praktisch geschnittene Zweizimmerwohnung mit Einbauküche und kleiner Terrasse.",
  },
  {
    id: "o3",
    adresse: "Wittekindstraße 22, 49080 Osnabrück",
    zimmer: 4,
    flaeche: 102,
    kaltmiete: 1280,
    lng: 8.0285,
    lat: 52.2724,
    createdAt: new Date("2024-04-05"),
    vermieter: "Dr. Thomas Becker",
    mieter: null,
    baujahr: 2012,
    etage: "3. OG mit Aufzug",
    heizung: "Gas-Brennwert",
    nebenkosten: 240,
    kaution: 3840,
    beschreibung:
      "Helle Familienwohnung mit großem Wohn-/Essbereich, zwei Bädern und Loggia.",
  },
  {
    id: "o4",
    adresse: "Bramscher Straße 88, 49088 Osnabrück",
    zimmer: 2,
    flaeche: 62,
    kaltmiete: 720,
    lng: 8.0408,
    lat: 52.2954,
    createdAt: new Date("2024-06-18"),
    vermieter: "Maria Schulz",
    mieter: "Lisa Hartmann",
    baujahr: 1978,
    etage: "1. OG",
    heizung: "Öl-Zentralheizung",
    nebenkosten: 160,
    kaution: 2160,
    beschreibung:
      "Gepflegte Wohnung mit Südbalkon, neuem Bad und ruhiger Lage am Stadtrand.",
  },
  {
    id: "o5",
    adresse: "Iburger Straße 30, 49082 Osnabrück",
    zimmer: 1,
    flaeche: 38,
    kaltmiete: 510,
    lng: 8.0509,
    lat: 52.2603,
    createdAt: new Date("2024-09-09"),
    vermieter: "Jörg Brandt",
    mieter: "Tim Voss",
    baujahr: 2001,
    etage: "4. OG",
    heizung: "Etagenheizung Gas",
    nebenkosten: 95,
    kaution: 1530,
    beschreibung:
      "Kompaktes Apartment, ideal für Studierende oder Singles, möbliert.",
  },
];

export function getMietobjekt(id: string): MietobjektDetail | undefined {
  return mietobjekte.find((m) => m.id === id);
}
