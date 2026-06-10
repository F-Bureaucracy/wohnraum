// Best-effort import of a rental listing from a public ImmobilienScout24 or
// Immowelt expose URL.
//
// Background: neither portal offers a free, public "fetch by link" API. The
// official ImmoScout24 Expose API requires content-partner approval plus a
// three-legged OAuth flow, and Immowelt's API is a SOAP service gated behind an
// issued API key. The only thing that works with nothing but a pasted public
// link is reading the structured data the portals embed in their HTML for SEO
// (schema.org JSON-LD). That is what we parse here. It is inherently best-effort:
// the portals may serve a bot-protection page instead of the listing, and not
// every field exists in the structured data.

import type { DemoListing } from "$lib/features";

export type ListingSource = "immoscout" | "immowelt";

export type ImportedListing = {
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  livingArea?: number;
  rooms?: number;
  bedrooms?: number;
  coldRent?: number;
  operatingCosts?: number;
  heatingCosts?: number;
  deposit?: number;
  description?: string;
};

export type ListingImportResult = {
  source: ListingSource;
  data: ImportedListing;
  /** Photo URLs found on the listing, in gallery order. */
  imageUrls: string[];
  /** Fields we could not extract from the page's structured data. */
  missing: string[];
};

export class ListingImportError extends Error {
  constructor(
    message: string,
    readonly code:
      | "invalid_url"
      | "unsupported_host"
      | "fetch_failed"
      | "blocked"
      | "no_data",
  ) {
    super(message);
    this.name = "ListingImportError";
  }
}

const SOURCE_HOSTS: Array<{
  source: ListingSource;
  match: (host: string) => boolean;
}> = [
  { source: "immoscout", match: (h) => h.endsWith("immobilienscout24.de") },
  { source: "immowelt", match: (h) => /(^|\.)immowelt\.(de|at|ch)$/.test(h) },
];

export function detectSource(rawUrl: string): ListingSource | null {
  let host: string;
  try {
    host = new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
  return SOURCE_HOSTS.find((s) => s.match(host))?.source ?? null;
}

export async function importListing(
  rawUrl: string,
): Promise<ListingImportResult> {
  const trimmed = rawUrl.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new ListingImportError(
      "Bitte geben Sie einen gültigen Link ein.",
      "invalid_url",
    );
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ListingImportError(
      "Bitte geben Sie einen gültigen Link ein.",
      "invalid_url",
    );
  }

  const source = detectSource(trimmed);
  if (!source) {
    throw new ListingImportError(
      "Nur Links von ImmobilienScout24 oder Immowelt werden unterstützt.",
      "unsupported_host",
    );
  }

  const html = await fetchHtml(url);

  // schema.org JSON-LD is the portable baseline. ImmoScout24 historically
  // exposes a full RealEstateListing this way; Immowelt only exposes a sparse
  // one, so for Immowelt we additionally read its embedded page state.
  const data = mapFromJsonLd(extractJsonLd(html));
  const imageUrls = source === "immowelt" ? extractImmoweltImages(html) : [];
  if (source === "immowelt") {
    mergeMissing(data, parseImmoweltState(html));
  }

  if (Object.keys(data).length === 0) {
    throw new ListingImportError(
      "Aus diesem Link konnten keine Daten gelesen werden. Bitte tragen Sie die Angaben manuell ein.",
      "no_data",
    );
  }

  const missing = WANTED.filter((key) => data[key] === undefined);

  return { source, data, imageUrls, missing };
}

// Fields we surface as "missing" when absent, so the case worker knows to fill
// them in manually.
const WANTED: Array<keyof ImportedListing> = [
  "street",
  "houseNumber",
  "postalCode",
  "city",
  "livingArea",
  "rooms",
  "coldRent",
];

// Build an import result from admin-configured demo data instead of fetching a
// portal. Used when the Demo-Import feature is active (see $lib/features); the
// pasted URL only decides which portal label to show.
export function demoListingToResult(
  demo: DemoListing,
  rawUrl: string,
): ListingImportResult {
  const { imageUrls, ...fields } = demo;
  const data: ImportedListing = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null && value !== "") {
      // @ts-expect-error indexed assignment across the union is safe here.
      data[key] = value;
    }
  }
  const source = detectSource(rawUrl) ?? "immowelt";
  const missing = WANTED.filter((key) => data[key] === undefined);
  return { source, data, imageUrls: imageUrls ?? [], missing };
}

async function fetchHtml(url: URL): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: {
        // A realistic browser UA reduces (but does not eliminate) the chance of
        // being served a bot-protection interstitial.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
      },
    });
  } catch {
    throw new ListingImportError(
      "Die Seite konnte nicht geladen werden. Bitte versuchen Sie es erneut.",
      "fetch_failed",
    );
  }

  if (
    response.status === 401 ||
    response.status === 403 ||
    response.status === 429
  ) {
    throw new ListingImportError(
      "Das Portal hat den automatischen Abruf blockiert. Bitte tragen Sie die Angaben manuell ein.",
      "blocked",
    );
  }
  if (!response.ok) {
    throw new ListingImportError(
      `Die Seite konnte nicht geladen werden (HTTP ${response.status}).`,
      "fetch_failed",
    );
  }

  return response.text();
}

/** Extract and JSON-parse every <script type="application/ld+json"> block. */
function extractJsonLd(html: string): unknown[] {
  const blocks: unknown[] = [];
  const regex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // Some sites HTML-escape the JSON; try a minimal unescape before giving up.
      try {
        blocks.push(JSON.parse(decodeHtmlEntities(raw)));
      } catch {
        // Ignore unparseable blocks.
      }
    }
  }
  return blocks;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Flatten JSON-LD documents into a list of candidate entity nodes. */
function flattenNodes(blocks: unknown[]): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      nodes.push(obj);
      if (Array.isArray(obj["@graph"])) obj["@graph"].forEach(visit);
    }
  };
  blocks.forEach(visit);
  return nodes;
}

const TYPE_HINTS = [
  "realestatelisting",
  "residence",
  "apartment",
  "house",
  "singlefamilyresidence",
  "accommodation",
  "place",
  "product",
  "offer",
];

function nodeTypes(node: Record<string, unknown>): string[] {
  const t = node["@type"];
  const list = Array.isArray(t) ? t : [t];
  return list
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.toLowerCase());
}

function mapFromJsonLd(blocks: unknown[]): ImportedListing {
  const nodes = flattenNodes(blocks);
  const result: ImportedListing = {};

  const relevant = nodes.filter((n) => {
    const types = nodeTypes(n);
    if (types.some((t) => TYPE_HINTS.includes(t))) return true;
    // Fall back to nodes that look like listings even without a known @type.
    return (
      "address" in n ||
      "floorSize" in n ||
      "numberOfRooms" in n ||
      "offers" in n
    );
  });

  for (const node of relevant) {
    applyAddress(result, node["address"]);

    const rooms = toInt(readNumber(node["numberOfRooms"]));
    if (rooms !== undefined && result.rooms === undefined) result.rooms = rooms;

    const bedrooms = toInt(readNumber(node["numberOfBedrooms"]));
    if (bedrooms !== undefined && result.bedrooms === undefined)
      result.bedrooms = bedrooms;

    const area = toInt(readNumber(node["floorSize"]));
    if (area !== undefined && result.livingArea === undefined)
      result.livingArea = area;

    const rent = readPrice(node["offers"] ?? node["price"]);
    if (rent !== undefined && result.coldRent === undefined)
      result.coldRent = rent;

    const description = readString(node["description"]);
    if (description && result.description === undefined) {
      result.description = description.slice(0, 4000);
    }
  }

  return result;
}

function applyAddress(result: ImportedListing, address: unknown): void {
  if (!address || typeof address !== "object") return;
  const a = address as Record<string, unknown>;

  const postalCode = readString(a["postalCode"]);
  if (postalCode && result.postalCode === undefined) {
    const digits = postalCode.match(/\d{5}/)?.[0];
    if (digits) result.postalCode = digits;
  }

  const city = readString(a["addressLocality"]);
  if (city && result.city === undefined) result.city = city;

  const streetAddress = readString(a["streetAddress"]);
  if (streetAddress && result.street === undefined) {
    const parsed = splitStreet(streetAddress);
    result.street = parsed.street;
    if (parsed.houseNumber && result.houseNumber === undefined) {
      result.houseNumber = parsed.houseNumber;
    }
  }
}

/** "Musterstraße 12a" -> { street: "Musterstraße", houseNumber: "12a" } */
function splitStreet(value: string): { street: string; houseNumber?: string } {
  const trimmed = value.trim();
  const match = trimmed.match(
    /^(.*?)[\s,]+(\d+\s*[a-zA-Z]?(?:[-/]\d+\s*[a-zA-Z]?)?)$/,
  );
  if (match) {
    return {
      street: match[1].trim(),
      houseNumber: match[2].replace(/\s+/g, ""),
    };
  }
  return { street: trimmed };
}

function readString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

/** Read a number from a raw number, numeric string, or QuantitativeValue. */
function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return parseLocaleNumber(value);
  if (value && typeof value === "object") {
    const v = (value as Record<string, unknown>)["value"];
    return readNumber(v);
  }
  return undefined;
}

/** Read a price from an Offer, array of Offers, or a raw value. */
function readPrice(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const price = readPrice(item);
      if (price !== undefined) return price;
    }
    return undefined;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const direct = readNumber(obj["price"]);
    if (direct !== undefined) return direct;
    const spec = obj["priceSpecification"];
    if (spec) return readPrice(spec);
    return undefined;
  }
  return readNumber(value);
}

function parseLocaleNumber(value: string): number | undefined {
  // Strip currency symbols/labels, keep digits and separators.
  let s = value.replace(/[^\d.,]/g, "");
  if (!s) return undefined;
  if (s.includes(",")) {
    // Comma is the decimal separator; dots are thousands ("1.234,56" -> 1234.56).
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // Dot used purely as a thousands separator ("1.100" -> 1100).
    s = s.replace(/\./g, "");
  }
  // Otherwise a lone dot is a decimal point ("685.00" -> 685).
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function toInt(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  const rounded = Math.round(value);
  return rounded > 0 ? rounded : undefined;
}

/** Copy fields from `extra` into `target` only where `target` has none yet. */
function mergeMissing(target: ImportedListing, extra: ImportedListing): void {
  for (const key of Object.keys(extra) as Array<keyof ImportedListing>) {
    if (target[key] === undefined && extra[key] !== undefined) {
      // @ts-expect-error indexed assignment across the union is safe here.
      target[key] = extra[key];
    }
  }
}

// Immowelt (AVIV) renders with React Server Components and embeds the listing
// state as escaped JSON in the HTML (keys appear as \"key\"). JSON-LD on these
// pages is sparse, so we read the fields we need straight from that payload.
function parseImmoweltState(html: string): ImportedListing {
  const result: ImportedListing = {};

  const fact = (type: string): string | undefined =>
    html.match(
      new RegExp(
        `\\\\"type\\\\":\\\\"${type}\\\\",\\\\"value\\\\":\\\\"[^"\\\\]*\\\\",\\\\"splitValue\\\\":\\\\"([^"\\\\]+)\\\\"`,
      ),
    )?.[1];

  result.rooms = toInt(parseLocaleNumber(fact("numberOfRooms") ?? ""));
  result.livingArea = toInt(parseLocaleNumber(fact("livingSpace") ?? ""));

  // Cold rent: the price object tagged as "Kaltmiete".
  const rent = html.match(
    /\\"value\\":\\"([\d.,]+)\s*€\\",\\"formatted\\":\\"[^"\\]*\\",\\"additionalInformation\\":\\"Kaltmiete\\"/,
  )?.[1];
  result.coldRent = parseLocaleNumber(rent ?? "");

  // Nebenkosten, Heizkosten and Kaution are not part of the JSON state, only the
  // rendered cost section. Read the euro amount that follows each label. When a
  // value is non-numeric (e.g. Kaution shown as "2 Kaltmieten") nothing matches.
  result.operatingCosts = labelAmount(html, "Nebenkosten");
  result.heatingCosts = labelAmount(html, "Heizkosten");
  result.deposit = labelAmount(html, "Kaution");

  // Location: city + zipCode are usually present; the exact street is often
  // withheld ("isAddressPublished":false).
  const loc = html.match(
    /\\"address\\":\{\\"country\\":\\"[A-Z]{2}\\",\\"city\\":\\"([^"\\]+)\\",\\"zipCode\\":\\"(\d{5})\\"/,
  );
  if (loc) {
    result.city = loc[1];
    result.postalCode = loc[2];
  }
  const street = html.match(/\\"street\\":\\"([^"\\]+)\\"/)?.[1];
  if (street) {
    const parsed = splitStreet(street);
    result.street = parsed.street;
    result.houseNumber = parsed.houseNumber;
  }

  // Drop undefined keys so mergeMissing only contributes real values.
  for (const key of Object.keys(result) as Array<keyof ImportedListing>) {
    if (result[key] === undefined) delete result[key];
  }
  return result;
}

const MAX_IMPORTED_IMAGES = 20;

/**
 * Collect the listing's photo URLs from the Immowelt CDN (mms.immowelt.de).
 * The same photo appears in several places (gallery state, og:image, srcset) and
 * in multiple sizes, so we de-duplicate by file name and keep the first (signed)
 * URL seen for each. Slashes may be escaped (\/) inside the embedded JSON.
 */
function extractImmoweltImages(html: string): string[] {
  const regex =
    /https:(?:\\?\/){2}mms\.immowelt\.de(?:\\?\/[^\s"'<>\\]+)+\.(?:jpe?g|png|webp)(?:\?[^\s"'<>\\]*)?/gi;
  const byFile = new Map<string, string>();
  for (const match of html.matchAll(regex)) {
    const url = match[0].replace(/\\\//g, "/");
    const fileName = url.split("?")[0].split("/").pop();
    if (fileName && !byFile.has(fileName)) byFile.set(fileName, url);
    if (byFile.size >= MAX_IMPORTED_IMAGES) break;
  }
  return [...byFile.values()];
}

const COST_LABELS = [
  "Kaltmiete",
  "Warmmiete",
  "Nebenkosten",
  "Heizkosten",
  "Kaution",
  "Provision",
];

/**
 * Read the euro amount rendered right after a labelled cost row, e.g.
 * `>Kaution</div>…<span>3300 €</span>` -> 3300. Returns undefined when the row
 * is absent or carries no numeric amount (e.g. "2 Kaltmieten", "nicht enthalten").
 *
 * The search window stops at the next cost label so a row without its own amount
 * cannot borrow the next row's value.
 */
function labelAmount(html: string, label: string): number | undefined {
  const start = html.indexOf(`>${label}<`);
  if (start < 0) return undefined;
  const from = start + label.length;
  let end = from + 400;
  for (const other of COST_LABELS) {
    if (other === label) continue;
    const next = html.indexOf(`>${other}<`, from);
    if (next >= 0 && next < end) end = next;
  }
  const match = html.slice(from, end).match(/>\s*([\d.][\d.,]*)\s*€\s*</);
  return match ? parseLocaleNumber(match[1]) : undefined;
}
