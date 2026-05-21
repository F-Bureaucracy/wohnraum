import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth.schema";

export const task = pgTable("task", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  priority: integer("priority").notNull().default(1),
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
  hasKitchen: boolean("has_kitchen").notNull().default(false),
  hasBalcony: boolean("has_balcony").notNull().default(false),

  coldRentCents: integer("cold_rent_cents").notNull(),
  operatingCostsCents: integer("operating_costs_cents").notNull().default(0),
  heatingCostsCents: integer("heating_costs_cents").notNull().default(0),
  depositCents: integer("deposit_cents").notNull().default(0),

  availableFrom: date("available_from").notNull(),
  minLeaseMonths: integer("min_lease_months"),

  maxOccupants: integer("max_occupants").notNull(),
  barrierFree: boolean("barrier_free").notNull().default(false),
  petsAllowed: boolean("pets_allowed").notNull().default(false),

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
  needsBarrierFree: boolean("needs_barrier_free").notNull().default(false),
  hasPets: boolean("has_pets").notNull().default(false),

  availableFrom: date("available_from"),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const vermieterNote = pgTable("vermieter_note", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
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
