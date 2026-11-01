import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  entities,
  events,
  households,
  users,
} from "../src/infrastructure/db/schema/index.js";
import { withTransaction } from "../src/infrastructure/db/transaction.js";
import type { MemberContext } from "../src/modules/households/authorization.js";
import {
  createEntity,
  recordEvent,
} from "../src/modules/households/history.js";
import { ensureMembership } from "../src/modules/households/membership.js";
import { createTestDatabase, type TestDatabase } from "./test-database.js";

describe.skipIf(!process.env.DATABASE_URL_UNPOOLED)(
  "state + event history",
  () => {
    let testDb: TestDatabase;
    let member: MemberContext;

    beforeEach(async () => {
      testDb = await createTestDatabase();
      const [user] = await testDb.database.db
        .insert(users)
        .values({ name: "Owner", email: "owner@example.com" })
        .returning();
      if (!user) throw new Error("no user");
      member = await ensureMembership(testDb.database.db, user);
    });

    afterEach(async () => {
      await testDb.cleanup();
    });

    const householdName = async () =>
      (
        await testDb.database.db
          .select({ name: households.name })
          .from(households)
          .where(eq(households.id, member.householdId))
      )[0]?.name;

    it("commits the state change and its event together", async () => {
      const { db } = testDb.database;
      await withTransaction(db, async (tx) => {
        await tx
          .update(households)
          .set({ name: "Home" })
          .where(eq(households.id, member.householdId));
        await recordEvent(tx, {
          householdId: member.householdId,
          entityId: member.householdId,
          eventType: "household.renamed",
          actorUserId: member.userId,
          payload: { from: "My household", to: "Home" },
        });
      });
      expect(await householdName()).toBe("Home");
      const renamed = await db
        .select()
        .from(events)
        .where(eq(events.eventType, "household.renamed"));
      expect(renamed).toHaveLength(1);
      expect(renamed[0]?.payload).toEqual({ from: "My household", to: "Home" });
    });

    it("rolls the state change back when the event payload is invalid", async () => {
      const { db } = testDb.database;
      await expect(
        withTransaction(db, async (tx) => {
          await tx
            .update(households)
            .set({ name: "Home" })
            .where(eq(households.id, member.householdId));
          await recordEvent(tx, {
            householdId: member.householdId,
            entityId: member.householdId,
            eventType: "household.renamed",
            actorUserId: member.userId,
            payload: { to: 42 } as never,
          });
        }),
      ).rejects.toThrow();
      expect(await householdName()).toBe("My household");
    });

    it("refuses an unknown event type", async () => {
      await expect(
        withTransaction(testDb.database.db, (tx) =>
          recordEvent(tx, {
            householdId: member.householdId,
            entityId: member.householdId,
            eventType: "household.exploded" as never,
            actorUserId: member.userId,
            payload: {} as never,
          }),
        ),
      ).rejects.toThrow(/household\.exploded/);
    });

    it("refuses a duplicate idempotency key within a household", async () => {
      const { db } = testDb.database;
      const record = () =>
        withTransaction(db, (tx) =>
          recordEvent(tx, {
            householdId: member.householdId,
            entityId: member.householdId,
            eventType: "household.renamed",
            actorUserId: member.userId,
            payload: { from: "a", to: "b" },
            idempotencyKey: "same-key",
          }),
        );
      await record();
      await expect(record()).rejects.toThrow();
    });

    it("creates an entity in the registry", async () => {
      const { db } = testDb.database;
      const id = await withTransaction(db, (tx) =>
        createEntity(tx, {
          householdId: member.householdId,
          entityType: "item",
        }),
      );
      const [row] = await db.select().from(entities).where(eq(entities.id, id));
      expect(row).toMatchObject({
        householdId: member.householdId,
        entityType: "item",
      });
    });
  },
);
