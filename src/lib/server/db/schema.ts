import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import type { DemoListing } from "$lib/features";
import { organization, user } from "./auth.schema";

export const task = pgTable("task", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  priority: integer("priority").notNull().default(1),
});

// Admin-editable matching filters. A single global list (no organization scoping)
// curated by administration-org admins; values are stored per entity in the
// `features` jsonb bags below, keyed by `key`.
export const filterDefinition = pgTable("filter_definition", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  mieterLabel: text("mieter_label"),
  appliesToMietobjekt: boolean("applies_to_mietobjekt").notNull().default(true),
  appliesToMieter: boolean("applies_to_mieter").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const mietobjekt = pgTable("mietobjekt", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  street: text("street").notNull(),
  houseNumber: text("house_number").notNull(),
  postalCode: text("postal_code").notNull(),
  city: text("city").notNull(),
  floor: text("floor"),
  unit: text("unit"),

  livingArea: integer("living_area").notNull(),
  rooms: integer("rooms").notNull(),
  bedrooms: integer("bedrooms"),

  coldRentCents: integer("cold_rent_cents").notNull(),
  operatingCostsCents: integer("operating_costs_cents").notNull().default(0),
  heatingCostsCents: integer("heating_costs_cents").notNull().default(0),
  depositCents: integer("deposit_cents").notNull().default(0),

  availableFrom: date("available_from").notNull(),
  minLeaseMonths: integer("min_lease_months"),

  maxOccupants: integer("max_occupants").notNull(),

  // Boolean matching features the apartment offers, keyed by filterDefinition.key.
  features: jsonb("features")
    .$type<Record<string, boolean>>()
    .notNull()
    .default({}),

  description: text("description"),

  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  geocodedAt: timestamp("geocoded_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const mietobjektImage = pgTable(
  "mietobjekt_image",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    mietobjektId: text("mietobjekt_id")
      .notNull()
      .references(() => mietobjekt.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type"),
    size: integer("size"),
    storageKey: text("storage_key").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("mietobjektImage_mietobjektId_idx").on(t.mietobjektId)],
);

export const mieter = pgTable("mieter", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  mietobjektId: text("mietobjekt_id").references(() => mietobjekt.id, {
    onDelete: "set null",
  }),

  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),

  email: text("email"),
  phone: text("phone"),

  householdSize: integer("household_size").notNull().default(1),
  maxColdRentCents: integer("max_cold_rent_cents"),

  // Boolean matching features the tenant needs, keyed by filterDefinition.key.
  features: jsonb("features")
    .$type<Record<string, boolean>>()
    .notNull()
    .default({}),

  availableFrom: date("available_from"),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Threaded notes attached to any entity (e.g. "vermieter", "mieter"), keyed
// polymorphically by entityType + entityId like `bookmark`. Multiple admins can
// add notes; each can only edit/delete their own.
export const note = pgTable("note", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const bookmark = pgTable(
  "bookmark",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.entityType, t.entityId)],
);

export const mietobjektReservation = pgTable(
  "mietobjekt_reservation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    mietobjektId: text("mietobjekt_id")
      .notNull()
      .references(() => mietobjekt.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.mietobjektId)],
);

export const appAuditLog = pgTable(
  "app_audit_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    status: text("status").default("success").notNull(),
    severity: text("severity").default("low").notNull(),
    metadata: text("metadata"),
    before: text("before"),
    after: text("after"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("appAuditLog_organizationId_idx").on(t.organizationId),
    index("appAuditLog_actorUserId_idx").on(t.actorUserId),
    index("appAuditLog_action_idx").on(t.action),
    index("appAuditLog_entity_idx").on(t.entityType, t.entityId),
    index("appAuditLog_createdAt_idx").on(t.createdAt),
  ],
);

// Per-organization settings, currently just a bag of boolean feature flags keyed
// by feature id (see $lib/features). One row per organization, created lazily on
// first toggle.
export const organizationSettings = pgTable("organization_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: "cascade" }),
  features: jsonb("features")
    .$type<Record<string, boolean>>()
    .notNull()
    .default({}),
  // Demo listing applied by the importer when the `demo-import` feature is on
  // (see $lib/features.DemoListing). Null until configured.
  demoListing: jsonb("demo_listing").$type<DemoListing>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// AI-generated data reports (f-omnes). A case worker enters a prompt; the report
// is generated asynchronously, so a row starts as `generating` and is later
// flipped to `ready` (with the editable HTML + the PDF stored in S3) or `error`.
export const report = pgTable(
  "report",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    prompt: text("prompt").notNull(),
    // generating | ready | error
    status: text("status").notNull().default("generating"),
    // Editable report HTML returned by f-omnes.
    sourceHtml: text("source_html"),
    // f-omnes' own report id, used to (re)fetch the PDF.
    omnesReportId: text("omnes_report_id"),
    // Key of the generated PDF in our S3 bucket.
    pdfStorageKey: text("pdf_storage_key"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("report_organizationId_idx").on(t.organizationId),
    index("report_createdAt_idx").on(t.createdAt),
  ],
);

export const conversation = pgTable("conversation", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
});

export const conversationParticipant = pgTable(
  "conversation_participant",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.conversationId, t.userId)],
);

export const message = pgTable("message", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversation.id, { onDelete: "cascade" }),
  senderId: text("sender_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export * from "./auth.schema";
