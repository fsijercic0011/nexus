import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth.js";
import { households } from "./households.js";

/** Sensitive and administrative changes (ADR 0007): membership, roles,
 * household settings, password and two-factor changes, session revocation. */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().default(sql`uuidv7()`),
    /** Null for account-level changes (password, two-factor). */
    householdId: uuid("household_id").references(() => households.id, {
      onDelete: "cascade",
    }),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** Dotted action name, e.g. "member.added", "2fa.enabled". */
    action: text("action").notNull(),
    targetEntityType: text("target_entity_type"),
    targetId: uuid("target_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    clientIp: text("client_ip"),
    userAgent: text("user_agent"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_logs_household_id_idx").on(table.householdId),
    index("audit_logs_actor_user_id_idx").on(table.actorUserId),
  ],
);
