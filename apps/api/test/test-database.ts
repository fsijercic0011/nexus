import { randomBytes } from "node:crypto";
import { parseDatabaseUrl } from "../src/infrastructure/config.js";
import {
  createDatabase,
  type Database,
} from "../src/infrastructure/db/client.js";
import { runMigrations } from "../src/infrastructure/db/migrate.js";

const TEST_DATABASE = /^test_(\d+)_[0-9a-f]{8}$/;

export type TestDatabase = {
  database: Database;
  databaseName: string;
  cleanup(): Promise<void>;
};

function assertNotProduction(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to manage test databases in production");
  }
}

/**
 * Creates a throwaway, migrated database. A whole database (not a schema)
 * because drizzle-kit writes "public".-qualified SQL. Never touches any other
 * database.
 */
export async function createTestDatabase(): Promise<TestDatabase> {
  assertNotProduction();
  const url = parseDatabaseUrl(
    "DATABASE_URL_UNPOOLED",
    process.env.DATABASE_URL_UNPOOLED,
  );

  const databaseName = `test_${Date.now()}_${randomBytes(4).toString("hex")}`;
  const admin = createDatabase(url);
  try {
    await admin.sql`create database ${admin.sql(databaseName)}`;
  } finally {
    await admin.close();
  }

  const testUrl = new URL(url);
  testUrl.pathname = `/${databaseName}`;
  const database = createDatabase(testUrl.toString());
  await runMigrations(database);

  return {
    database,
    databaseName,
    async cleanup() {
      await database.close();
      const dropper = createDatabase(url);
      try {
        await dropper.sql`drop database if exists ${dropper.sql(databaseName)} with (force)`;
      } finally {
        await dropper.close();
      }
    },
  };
}

/** Drops `test_*` databases older than the threshold; returns their names. */
export async function pruneStaleTestDatabases(
  admin: Database,
  olderThanMs = 3_600_000,
): Promise<string[]> {
  assertNotProduction();
  const rows = await admin.sql<{ name: string }[]>`
    select datname as name from pg_database where left(datname, 5) = 'test_'`;
  const cutoff = Date.now() - olderThanMs;
  const stale = rows
    .map((row) => row.name)
    .filter((name) => {
      const match = TEST_DATABASE.exec(name);
      return match !== null && Number(match[1]) < cutoff;
    });
  for (const name of stale) {
    await admin.sql`drop database if exists ${admin.sql(name)} with (force)`;
  }
  return stale;
}
