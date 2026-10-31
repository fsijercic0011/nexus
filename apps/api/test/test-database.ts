import { randomBytes } from "node:crypto";
import {
  createDatabase,
  type Database,
} from "../src/infrastructure/db/client.js";
import { runMigrations } from "../src/infrastructure/db/migrate.js";

const TEST_SCHEMA = /^test_(\d+)_[0-9a-f]{8}$/;

export type TestDatabase = {
  database: Database;
  schemaName: string;
  cleanup(): Promise<void>;
};

/** Creates a throwaway, migrated schema. Never touches any other schema. */
export async function createTestDatabase(): Promise<TestDatabase> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to create a test database in production");
  }
  const url = process.env.DATABASE_URL_UNPOOLED;
  if (!url) {
    throw new Error("DATABASE_URL_UNPOOLED is not set");
  }

  const schemaName = `test_${Date.now()}_${randomBytes(4).toString("hex")}`;
  const admin = createDatabase(url);
  try {
    await admin.sql`create schema ${admin.sql(schemaName)}`;
  } finally {
    await admin.close();
  }

  const database = createDatabase(url, { searchPath: schemaName });
  await runMigrations(database, { migrationsSchema: schemaName });

  return {
    database,
    schemaName,
    async cleanup() {
      await database.sql`drop schema if exists ${database.sql(schemaName)} cascade`;
      await database.close();
    },
  };
}

/** Drops `test_*` schemas older than the threshold; returns their names. */
export async function pruneStaleTestSchemas(
  database: Database,
  olderThanMs = 3_600_000,
): Promise<string[]> {
  const rows = await database.sql<{ name: string }[]>`
    select schema_name as name from information_schema.schemata
    where schema_name like 'test\_%'`;
  const cutoff = Date.now() - olderThanMs;
  const stale = rows
    .map((row) => row.name)
    .filter((name) => {
      const match = TEST_SCHEMA.exec(name);
      return match !== null && Number(match[1]) < cutoff;
    });
  for (const name of stale) {
    await database.sql`drop schema if exists ${database.sql(name)} cascade`;
  }
  return stale;
}
