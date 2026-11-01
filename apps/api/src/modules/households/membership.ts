import { asc, eq, sql } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import {
  householdMembers,
  households,
} from "../../infrastructure/db/schema/index.js";
import {
  type Db,
  withTransaction,
} from "../../infrastructure/db/transaction.js";
import { writeAudit } from "./audit.js";
import type { MemberContext } from "./authorization.js";
import { createEntity, recordEvent } from "./history.js";

export const DEFAULT_HOUSEHOLD_NAME = "My household";

/**
 * The user's membership, creating their household on first use: a new
 * household with them as admin, its `household.created` event and a
 * `member.added` audit entry, all in one transaction.
 *
 * A per-user advisory lock serializes concurrent first requests, so they
 * create one household. A person may belong to several households later
 * (ADR 0004); until household switching exists, the oldest membership is
 * the active one.
 */
export async function ensureMembership(
  db: Db,
  user: { id: string; name: string },
): Promise<MemberContext> {
  return withTransaction(db, async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`membership:${user.id}`}))`,
    );
    const [existing] = await tx
      .select()
      .from(householdMembers)
      .where(eq(householdMembers.userId, user.id))
      .orderBy(asc(householdMembers.createdAt), asc(householdMembers.id))
      .limit(1);
    if (existing) {
      return {
        userId: user.id,
        memberId: existing.id,
        householdId: existing.householdId,
        role: existing.role,
      };
    }

    const householdId = uuidv7();
    await tx
      .insert(households)
      .values({ id: householdId, name: DEFAULT_HOUSEHOLD_NAME });
    await createEntity(tx, {
      id: householdId,
      householdId,
      entityType: "household",
    });
    const [member] = await tx
      .insert(householdMembers)
      .values({ householdId, userId: user.id, role: "admin" })
      .returning();
    if (!member) throw new Error("Membership insert returned no row");
    await recordEvent(tx, {
      householdId,
      entityId: householdId,
      eventType: "household.created",
      actorUserId: user.id,
      payload: { name: DEFAULT_HOUSEHOLD_NAME },
    });
    await writeAudit(tx, {
      householdId,
      actorUserId: user.id,
      action: "member.added",
      targetEntityType: "household_member",
      targetId: member.id,
      after: { userId: user.id, role: "admin" },
    });
    return {
      userId: user.id,
      memberId: member.id,
      householdId,
      role: member.role,
    };
  });
}
