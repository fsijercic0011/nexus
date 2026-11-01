import { sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth.js";

export const memberRole = pgEnum("member_role", ["admin", "member", "guest"]);

/**
 * The tenancy boundary (ADR 0004). A household is itself an entity: its id is
 * also its row in `entities` (that foreign key is DEFERRABLE and added by the
 * hand-written migration 0004, because entities.household_id points back
 * here).
 */
export const households = pgTable("households", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const householdMembers = pgTable(
  "household_members",
  {
    id: uuid("id").primaryKey().default(sql`uuidv7()`),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRole("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("household_members_household_user_unique").on(
      table.householdId,
      table.userId,
    ),
    index("household_members_user_id_idx").on(table.userId),
  ],
);

/** A place the household manages (ADR 0004). Schema only; the UI assumes one. */
export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("properties_household_id_idx").on(table.householdId)],
);
