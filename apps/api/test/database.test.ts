import { afterEach, describe, expect, it } from "vitest";
import { createDatabase } from "../src/infrastructure/db/client.js";
import { createTestDatabase, pruneStaleTestSchemas } from "./test-database.js";

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) {
  console.warn("DATABASE_URL_UNPOOLED is not set — skipping database tests.");
}

async function schemaExists(name: string): Promise<boolean> {
  const admin = createDatabase(url ?? "");
  try {
    const rows = await admin.sql`
      select 1 from information_schema.schemata where schema_name = ${name}`;
    return rows.length > 0;
  } finally {
    await admin.close();
  }
}

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

  it("isolates each run in its own schema", async () => {
    const { database, schemaName, cleanup } = await createTestDatabase();
    const [row] = await database.sql`select current_schema() as schema`;
    expect(row?.schema).toBe(schemaName);
    expect(schemaName).toMatch(/^test_\d+_[0-9a-f]{8}$/);
    await cleanup();
    expect(await schemaExists(schemaName)).toBe(false);
  });

  it("prunes only stale test schemas", async () => {
    const admin = createDatabase(url ?? "");
    const stale = `test_${Date.now() - 2 * 3_600_000}_aaaaaaaa`;
    const fresh = `test_${Date.now()}_bbbbbbbb`;
    try {
      await admin.sql`create schema ${admin.sql(stale)}`;
      await admin.sql`create schema ${admin.sql(fresh)}`;
      const dropped = await pruneStaleTestSchemas(admin);
      expect(dropped).toContain(stale);
      expect(dropped).not.toContain(fresh);
      expect(await schemaExists(fresh)).toBe(true);
    } finally {
      await admin.sql`drop schema if exists ${admin.sql(stale)} cascade`;
      await admin.sql`drop schema if exists ${admin.sql(fresh)} cascade`;
      await admin.close();
    }
  });

  it("refuses to run in production", async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      await expect(createTestDatabase()).rejects.toThrow(/production/);
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});
