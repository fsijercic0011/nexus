import { sql } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  householdMembers,
  ownedRecordColumns,
  users,
} from "../src/infrastructure/db/schema/index.js";
import {
  assertCanWrite,
  assertRole,
  ForbiddenError,
  type MemberContext,
  visibleTo,
} from "../src/modules/households/authorization.js";
import { ensureMembership } from "../src/modules/households/membership.js";
import { createTestDatabase, type TestDatabase } from "./test-database.js";

// A scratch domain table, created only in the test database.
const testRecords = pgTable("test_records", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  householdId: uuid("household_id").notNull(),
  label: text("label").notNull(),
  ...ownedRecordColumns(),
});

const guestOf = (member: MemberContext): MemberContext => ({
  ...member,
  role: "guest",
});

describe("assertCanWrite and assertRole", () => {
  const owner: MemberContext = {
    userId: "u1",
    memberId: "m1",
    householdId: "h1",
    role: "member",
  };

  it("lets a member write shared records and their own private ones", () => {
    expect(() =>
      assertCanWrite(owner, {
        householdId: "h1",
        visibility: "shared",
        ownerMemberId: "m2",
      }),
    ).not.toThrow();
    expect(() =>
      assertCanWrite(owner, {
        householdId: "h1",
        visibility: "private",
        ownerMemberId: "m1",
      }),
    ).not.toThrow();
  });

  it("refuses guests, other households and other members' private records", () => {
    const shared = {
      householdId: "h1",
      visibility: "shared" as const,
      ownerMemberId: null,
    };
    expect(() => assertCanWrite(guestOf(owner), shared)).toThrow(
      ForbiddenError,
    );
    expect(() =>
      assertCanWrite(owner, { ...shared, householdId: "h2" }),
    ).toThrow(ForbiddenError);
    expect(() =>
      assertCanWrite(owner, {
        householdId: "h1",
        visibility: "private",
        ownerMemberId: "m2",
      }),
    ).toThrow(ForbiddenError);
  });

  it("checks roles", () => {
    expect(() => assertRole(owner, "admin")).toThrow(ForbiddenError);
    expect(() => assertRole(owner, "admin", "member")).not.toThrow();
  });
});

describe.skipIf(!process.env.DATABASE_URL_UNPOOLED)("visibleTo", () => {
  let testDb: TestDatabase;

  beforeEach(async () => {
    testDb = await createTestDatabase();
    await testDb.database.sql`
      create table test_records (
        id uuid primary key default uuidv7(),
        household_id uuid not null,
        label text not null,
        visibility visibility not null default 'shared',
        owner_member_id uuid references household_members(id)
      )`;
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  async function memberFor(email: string): Promise<MemberContext> {
    const [user] = await testDb.database.db
      .insert(users)
      .values({ name: email, email })
      .returning();
    if (!user) throw new Error("no user");
    return ensureMembership(testDb.database.db, user);
  }

  it("shows a member their household's shared rows and their own private rows only", async () => {
    const { db } = testDb.database;
    const a = await memberFor("a@example.com");
    const b = await memberFor("b@example.com");
    // A second member of household A.
    const [aUser2] = await db
      .insert(users)
      .values({ name: "a2", email: "a2@example.com" })
      .returning();
    const [a2Row] = await db
      .insert(householdMembers)
      .values({
        householdId: a.householdId,
        userId: aUser2?.id ?? "",
        role: "member",
      })
      .returning();
    const a2: MemberContext = {
      userId: aUser2?.id ?? "",
      memberId: a2Row?.id ?? "",
      householdId: a.householdId,
      role: "member",
    };

    await db.insert(testRecords).values([
      { householdId: a.householdId, label: "A shared" },
      {
        householdId: a.householdId,
        label: "A private (a)",
        visibility: "private",
        ownerMemberId: a.memberId,
      },
      {
        householdId: a.householdId,
        label: "A private (a2)",
        visibility: "private",
        ownerMemberId: a2.memberId,
      },
      { householdId: b.householdId, label: "B shared" },
    ]);

    const labelsFor = async (member: MemberContext) =>
      (
        await db
          .select({ label: testRecords.label })
          .from(testRecords)
          .where(visibleTo(testRecords, member))
      )
        .map((row) => row.label)
        .sort();

    expect(await labelsFor(a)).toEqual(["A private (a)", "A shared"]);
    expect(await labelsFor(a2)).toEqual(["A private (a2)", "A shared"]);
    expect(await labelsFor(b)).toEqual(["B shared"]);
    expect(await labelsFor(guestOf(a))).toEqual(["A shared"]);
  });
});
