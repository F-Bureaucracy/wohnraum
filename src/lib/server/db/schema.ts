import {
  boolean,
  date,
  doublePrecision,
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

export * from "./auth.schema";
