import { auditLogs } from "../../infrastructure/db/schema/index.js";
import type { DbOrTx } from "../../infrastructure/db/transaction.js";

export type AuditEntry = Omit<
  typeof auditLogs.$inferInsert,
  "id" | "occurredAt"
>;

/** Writes one audit entry (ADR 0007). Pass the transaction of the change it
 * records, so the change and its audit commit together. */
export async function writeAudit(db: DbOrTx, entry: AuditEntry): Promise<void> {
  await db.insert(auditLogs).values(entry);
}
