import { afterEach, describe, expect, it } from "vitest";
import { ConfigError } from "../src/infrastructure/config.js";
import { createDatabase } from "../src/infrastructure/db/client.js";
import {
  createTestDatabase,
  pruneStaleTestDatabases,
} from "./test-database.js";

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) {
  console.warn("DATABASE_URL_UNPOOLED is not set — skipping database tests.");
}

async function adminQuery<T>(
  query: (admin: ReturnType<typeof createDatabase>) => Promise<T>,
) {
  const admin = createDatabase(url ?? "");
  try {
    return await query(admin);
  } finally {
    await admin.close();
  }
}

const databaseExists = (name: string) =>
  adminQuery(async (admin) => {
    const rows =
      await admin.sql`select 1 from pg_database where datname = ${name}`;
    return rows.length > 0;
  });

describe.skipIf(!url)("database", () => {
  const cleanups: Array<() => Promise<void>> = [];
  afterEach(async () => {
    for (const cleanup of cleanups.splice(0)) await cleanup();
  });

  it("connects to Postgres 18 or newer", async () => {
    const { database, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);
    const [row] = await database.sql`
      select current_setting('server_version_num')::int as version`;
    expect(row?.version).toBeGreaterThanOrEqual(180000);
  });

  it("generates UUIDv7 natively", async () => {
    const { database, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);
    const [row] = await database.sql`select uuidv7()::text as id`;
    expect(String(row?.id)[14]).toBe("7");
  });

  it("isolates each run in its own database", async () => {
    const { database, databaseName, cleanup } = await createTestDatabase();
    const [row] = await database.sql`select current_database() as name`;
    expect(row?.name).toBe(databaseName);
    expect(databaseName).toMatch(/^test_\d+_[0-9a-f]{8}$/);
    await cleanup();
    expect(await databaseExists(databaseName)).toBe(false);
  });

  it("keeps public-qualified objects inside the test database", async () => {
    // drizzle-kit writes "public".-qualified enums and foreign keys.
    const { database, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);
    await database.sql`create type "public"."nexus_isolation_probe" as enum ('a')`;
    await database.sql`create table "public"."probe_parent" (id int primary key)`;
    await database.sql`create table "public"."probe_child" (
      parent_id int references "public"."probe_parent"(id))`;
    const leaked = await adminQuery(
      (admin) =>
        admin.sql`select 1 from pg_type where typname = 'nexus_isolation_probe'`,
    );
    expect(leaked).toHaveLength(0);
  });

  it("prunes only stale test databases", async () => {
    const stale = `test_${Date.now() - 2 * 3_600_000}_aaaaaaaa`;
    const fresh = `test_${Date.now()}_bbbbbbbb`;
    await adminQuery(async (admin) => {
      try {
        await admin.sql`create database ${admin.sql(stale)}`;
        await admin.sql`create database ${admin.sql(fresh)}`;
        const dropped = await pruneStaleTestDatabases(admin);
        expect(dropped).toContain(stale);
        expect(dropped).not.toContain(fresh);
        expect(await databaseExists(fresh)).toBe(true);
      } finally {
        await admin.sql`drop database if exists ${admin.sql(stale)} with (force)`;
        await admin.sql`drop database if exists ${admin.sql(fresh)} with (force)`;
      }
    });
  });

  it("refuses to run in production", async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      await expect(createTestDatabase()).rejects.toThrow(/production/);
      await expect(
        adminQuery((admin) => pruneStaleTestDatabases(admin)),
      ).rejects.toThrow(/production/);
    } finally {
      process.env.NODE_ENV = previous;
    }
  });

  it("rejects a malformed DATABASE_URL_UNPOOLED without echoing it", async () => {
    const previous = process.env.DATABASE_URL_UNPOOLED;
    process.env.DATABASE_URL_UNPOOLED = "postgres://owner:ab/cd@host/db";
    try {
      const error = await createTestDatabase().catch(
        (caught: unknown) => caught,
      );
      expect(error).toBeInstanceOf(ConfigError);
      expect(String((error as Error).message)).not.toContain("ab/cd");
    } finally {
      process.env.DATABASE_URL_UNPOOLED = previous;
    }
  });
});
