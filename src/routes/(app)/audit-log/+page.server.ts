import { error, redirect } from "@sveltejs/kit";
import { desc, eq, inArray } from "drizzle-orm";
import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { appAuditLog, mietobjekt, user } from "$lib/server/db/schema";
import { loadFilterDefinitions } from "$lib/server/filter-definitions";
import { mieterLabel, type FilterDefinition } from "$lib/matching-flags";
import type { PageServerLoad } from "./$types";

async function requireAuditAccess(headers: Headers) {
  const activeMember = await auth.api
    .getActiveMember({ headers })
    .catch(() => null);
  const role = activeMember?.role ?? "";
  if (role !== "owner" && role !== "admin") {
    throw error(403, "Keine Berechtigung, Änderungen einzusehen");
  }
}

function parseJson(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

const euroFmt = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});
const euro = (v: unknown) =>
  v == null ? "—" : euroFmt.format(Number(v) / 100);
const plain = (v: unknown) => (v == null || v === "" ? "—" : String(v));
const boolText = (v: unknown) =>
  v === true || v === "true"
    ? "Ja"
    : v === false || v === "false"
      ? "Nein"
      : plain(v);
const genderLabels: Record<string, string> = {
  female: "Weiblich",
  male: "Männlich",
  diverse: "Divers",
  unspecified: "Keine Angabe",
};

type FieldDef = { label: string; format?: (v: unknown) => string };

const mietobjektFields: Record<string, FieldDef> = {
  street: { label: "Straße" },
  houseNumber: { label: "Hausnummer" },
  postalCode: { label: "PLZ" },
  city: { label: "Stadt" },
  floor: { label: "Etage" },
  unit: { label: "Einheit" },
  livingArea: {
    label: "Wohnfläche",
    format: (v) => (v == null ? "—" : `${v} m²`),
  },
  rooms: { label: "Zimmer" },
  bedrooms: { label: "Schlafzimmer" },
  coldRentCents: { label: "Kaltmiete", format: euro },
  operatingCostsCents: { label: "Nebenkosten", format: euro },
  heatingCostsCents: { label: "Heizkosten", format: euro },
  depositCents: { label: "Kaution", format: euro },
  availableFrom: { label: "Verfügbar ab" },
  minLeaseMonths: { label: "Mindestmietdauer" },
  maxOccupants: { label: "Max. Personen" },
  description: { label: "Beschreibung" },
  // Legacy columns (before features moved into jsonb), for old log entries.
  barrierFree: { label: "Barrierearm", format: boolText },
  petsAllowed: { label: "Haustiere erlaubt", format: boolText },
  hasKitchen: { label: "Küche inklusive", format: boolText },
  hasBalcony: { label: "Balkon/Gartennutzung", format: boolText },
};

const mieterFields: Record<string, FieldDef> = {
  firstName: { label: "Vorname" },
  lastName: { label: "Nachname" },
  dateOfBirth: { label: "Geburtsdatum" },
  gender: {
    label: "Geschlecht",
    format: (v) => genderLabels[String(v)] ?? plain(v),
  },
  email: { label: "E-Mail" },
  phone: { label: "Telefon" },
  householdSize: { label: "Haushaltsgröße" },
  maxColdRentCents: { label: "Max. Kaltmiete", format: euro },
  availableFrom: { label: "Verfügbar ab" },
  notes: { label: "Notizen" },
  needsBarrierFree: { label: "Barrierearm benötigt", format: boolText },
  hasPets: { label: "Haustiere", format: boolText },
};

const noteFields: Record<string, FieldDef> = {
  body: { label: "Notiztext" },
};

const fieldsByEntity: Record<string, Record<string, FieldDef>> = {
  mietobjekt: mietobjektFields,
  mieter: mieterFields,
  "vermieter-note": noteFields,
};

// Bookkeeping / noise columns that should never appear as a "change".
const ignoredKeys = new Set([
  "id",
  "organizationId",
  "actorUserId",
  "mietobjektId",
  "createdAt",
  "updatedAt",
  "geocodedAt",
  "latitude",
  "longitude",
]);

function humanize(key: string) {
  return key
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function truncate(s: string, max = 60) {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export type Change = { label: string; from: string; to: string };

function featureChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  entityType: string,
  filterDefs: FilterDefinition[],
): Change[] {
  const a = (before.features ?? {}) as Record<string, unknown>;
  const b = (after.features ?? {}) as Record<string, unknown>;
  const out: Change[] = [];
  const labelByKey = new Map<string, string>();
  for (const d of filterDefs) {
    labelByKey.set(d.key, entityType === "mieter" ? mieterLabel(d) : d.label);
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const av = a[key] === true;
    const bv = b[key] === true;
    if (av === bv) continue;
    out.push({
      label: labelByKey.get(key) ?? humanize(key),
      from: av ? "Ja" : "Nein",
      to: bv ? "Ja" : "Nein",
    });
  }
  return out;
}

function diff(
  entityType: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  filterDefs: FilterDefinition[],
): Change[] {
  if (!before || !after) return [];
  const fields = fieldsByEntity[entityType] ?? {};
  const changes: Change[] = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (ignoredKeys.has(key)) continue;
    if (key === "features") {
      changes.push(...featureChanges(before, after, entityType, filterDefs));
      continue;
    }
    const a = before[key];
    const b = after[key];
    if (String(a ?? "") === String(b ?? "")) continue;
    const def = fields[key];
    const fmt = def?.format ?? plain;
    changes.push({
      label: def?.label ?? humanize(key),
      from: truncate(fmt(a)),
      to: truncate(fmt(b)),
    });
  }
  return changes;
}

type EntityRef = { label: string; href: string | null };

const detailPath: Record<string, string> = {
  mieter: "/admin/mieter",
  mietobjekt: "/admin/mietobjekte",
};

function buildSubject(
  entityType: string,
  verb: string,
  entityId: string | null,
  label: string | null,
): EntityRef | null {
  if (!label) return null;
  const base = detailPath[entityType];
  if (!base) return { label, href: null };
  // A deleted entity has no detail page to link to.
  const href = verb === "delete" || !entityId ? null : `${base}/${entityId}`;
  return { label, href };
}

export const load: PageServerLoad = async (event) => {
  if (!event.locals.user) throw redirect(302, "/login");
  const activeOrg = event.locals.activeOrganization;
  if (!activeOrg) throw error(403, "Keine aktive Organisation");
  await requireAuditAccess(event.request.headers);

  const [rows, filterDefs] = await Promise.all([
    db
      .select({
        id: appAuditLog.id,
        action: appAuditLog.action,
        entityType: appAuditLog.entityType,
        entityId: appAuditLog.entityId,
        status: appAuditLog.status,
        metadata: appAuditLog.metadata,
        before: appAuditLog.before,
        after: appAuditLog.after,
        createdAt: appAuditLog.createdAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(appAuditLog)
      .leftJoin(user, eq(user.id, appAuditLog.actorUserId))
      .where(eq(appAuditLog.organizationId, activeOrg.id))
      .orderBy(desc(appAuditLog.createdAt))
      .limit(200),
    loadFilterDefinitions(),
  ]);

  // Collect apartment ids that need an address resolved: reserve/unreserve refer
  // to the apartment via entityId, assign/unassign via metadata.mietobjektId.
  const apartmentIds = new Set<string>();
  for (const r of rows) {
    if (r.entityType === "mietobjekt" && r.entityId)
      apartmentIds.add(r.entityId);
    const meta = parseJson(r.metadata);
    if (typeof meta?.mietobjektId === "string")
      apartmentIds.add(meta.mietobjektId);
  }
  const addresses = new Map<string, string>();
  if (apartmentIds.size > 0) {
    const aps = await db
      .select({
        id: mietobjekt.id,
        street: mietobjekt.street,
        houseNumber: mietobjekt.houseNumber,
        city: mietobjekt.city,
      })
      .from(mietobjekt)
      .where(inArray(mietobjekt.id, [...apartmentIds]));
    for (const ap of aps) {
      addresses.set(ap.id, `${ap.street} ${ap.houseNumber}, ${ap.city}`);
    }
  }

  const logs = rows.map((r) => {
    const verb = r.action.split(":")[1] ?? "";
    const meta = parseJson(r.metadata);
    const metaLabel = typeof meta?.label === "string" ? meta.label : null;

    // The label for a mietobjekt may come from metadata (create/update) or be
    // resolved from the apartment table (reserve/unreserve, which carry none).
    const subjectLabel =
      metaLabel ??
      (r.entityType === "mietobjekt" && r.entityId
        ? (addresses.get(r.entityId) ?? null)
        : null);
    const subject = buildSubject(r.entityType, verb, r.entityId, subjectLabel);

    let target: EntityRef | null = null;
    const targetApId =
      typeof meta?.mietobjektId === "string" ? meta.mietobjektId : null;
    const targetAddress = targetApId ? addresses.get(targetApId) : undefined;
    if (targetApId && targetAddress) {
      target = {
        label: targetAddress,
        href: `/admin/mietobjekte/${targetApId}`,
      };
    }

    return {
      id: r.id,
      action: r.action,
      entityType: r.entityType,
      status: r.status,
      createdAt: r.createdAt,
      actor: r.userName ?? r.userEmail ?? "Unbekannt",
      subject,
      target,
      changes: diff(
        r.entityType,
        parseJson(r.before),
        parseJson(r.after),
        filterDefs,
      ),
    };
  });

  return { logs };
};
