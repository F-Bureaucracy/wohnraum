export type Geocoded = { latitude: number; longitude: number };

export type AddressInput = {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
};

const USER_AGENT = "wohnraum-osnabrueck/1.0 (admin@osnabrueck.de)";

export async function geocodeAddress(
  address: AddressInput,
): Promise<Geocoded | null> {
  const params = new URLSearchParams({
    format: "jsonv2",
    limit: "1",
    addressdetails: "0",
    street: `${address.houseNumber} ${address.street}`.trim(),
    postalcode: address.postalCode,
    city: address.city,
    country: "Germany",
  });

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "de",
      },
    });
    if (!res.ok) {
      console.warn("[geocode] nominatim status", res.status);
      return null;
    }
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(data) || data.length === 0) return null;
    const lat = Number.parseFloat(data[0].lat);
    const lon = Number.parseFloat(data[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    return { latitude: lat, longitude: lon };
  } catch (err) {
    console.warn("[geocode] failed", err);
    return null;
  }
}
