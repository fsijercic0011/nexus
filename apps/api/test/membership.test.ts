import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  auditLogs,
  events,
  householdMembers,
  households,
  users,
} from "../src/infrastructure/db/schema/index.js";
import { ensureMembership } from "../src/modules/households/membership.js";
import { createTestDatabase, type TestDatabase } from "./test-database.js";

describe.skipIf(!process.env.DATABASE_URL_UNPOOLED)("ensureMembership", () => {
  let testDb: TestDatabase;
  let user: { id: string; name: string };

  beforeEach(async () => {
    testDb = await createTestDatabase();
    const [row] = await testDb.database.db
      .insert(users)
      .values({ name: "Owner", email: "owner@example.com" })
      .returning();
    if (!row) throw new Error("no user");
    user = { id: row.id, name: row.name };
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  it("creates a household with the user as admin, a created event and an audit entry", async () => {
    const { db } = testDb.database;
    const member = await ensureMembership(db, user);

    expect(member.role).toBe("admin");
    expect(member.userId).toBe(user.id);
    const [household] = await db.select().from(households);
    expect(household?.name).toBe("My household");
    expect(member.householdId).toBe(household?.id);

    const createdEvents = await db
      .select()
      .from(events)
      .where(eq(events.eventType, "household.created"));
    expect(createdEvents).toHaveLength(1);
    expect(createdEvents[0]?.entityId).toBe(household?.id);

    const audit = await db.select().from(auditLogs);
    expect(audit.map((row) => row.action)).toEqual(["member.added"]);
    expect(audit[0]?.targetId).toBe(member.memberId);
  });

  it("returns the existing membership on later calls", async () => {
    const { db } = testDb.database;
    const first = await ensureMembership(db, user);
    const second = await ensureMembership(db, user);
    expect(second).toEqual(first);
    expect(await db.select().from(households)).toHaveLength(1);
  });

  it("creates exactly one household under concurrent first requests", async () => {
    const { db } = testDb.database;
    const results = await Promise.all(
      Array.from({ length: 10 }, () => ensureMembership(db, user)),
    );
    expect(new Set(results.map((r) => r.householdId)).size).toBe(1);
    expect(await db.select().from(households)).toHaveLength(1);
    expect(await db.select().from(householdMembers)).toHaveLength(1);
  });
});
