import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth.js";
import { householdMembers, households } from "./households.js";

/** The registry giving every addressable row a common identity (ADR 0005).
 * Domain tables use the entity's id as their own primary key. */
export const entities = pgTable(
  "entities",
  {
    id: uuid("id").primaryKey().default(sql`uuidv7()`),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [index("entities_household_id_idx").on(table.householdId)],
);

/** Domain history: one row per state change, written in the same
 * transaction as the change (ADR 0005). Kept permanently. */
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().default(sql`uuidv7()`),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** "user", "system" or "integration:<name>". */
    source: text("source").notNull().default("user"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    payload: jsonb("payload").notNull(),
    correlationId: uuid("correlation_id"),
    idempotencyKey: text("idempotency_key"),
  },
  (table) => [
    index("events_entity_id_idx").on(table.entityId),
    uniqueIndex("events_household_idempotency_key_unique")
      .on(table.householdId, table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);

export const visibility = pgEnum("visibility", ["shared", "private"]);

/** Columns for a domain table whose records can be private to one member
 * (ADR 0004). Spread into the table definition. */
export function ownedRecordColumns() {
  return {
    visibility: visibility("visibility").notNull().default("shared"),
    ownerMemberId: uuid("owner_member_id").references(
      () => householdMembers.id,
      { onDelete: "set null" },
    ),
  };
}
