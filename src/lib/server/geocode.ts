export type Geocoded = { latitude: number; longitude: number };

export type AddressInput = {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
};

const USER_AGENT = "wohnraum-osnabrueck/1.0 (admin@osnabrueck.de)";

export type AddressSuggestion = {
  id: string;
  label: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
};

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

type NominatimAddress = {
  road?: string;
  pedestrian?: string;
  footway?: string;
  path?: string;
  house_number?: string;
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
};

type NominatimSearchResult = {
  place_id: number;
  display_name: string;
  address?: NominatimAddress;
};

export async function searchAddressSuggestions(
  query: string,
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    format: "jsonv2",
    limit: "5",
    addressdetails: "1",
    countrycodes: "de",
    q: trimmed,
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
      console.warn("[address-search] nominatim status", res.status);
      return [];
    }

    const data = (await res.json()) as NominatimSearchResult[];
    if (!Array.isArray(data)) return [];

    return data
      .map((result) => {
        const address = result.address ?? {};
        const street =
          address.road ?? address.pedestrian ?? address.footway ?? address.path ?? "";
        const city =
          address.city ??
          address.town ??
          address.village ??
          address.municipality ??
          "";

        return {
          id: String(result.place_id),
          label: result.display_name,
          street,
          houseNumber: address.house_number ?? "",
          postalCode: address.postcode ?? "",
          city,
        };
      })
      .filter((suggestion) => suggestion.street && suggestion.city);
  } catch (err) {
    console.warn("[address-search] failed", err);
    return [];
  }
}
