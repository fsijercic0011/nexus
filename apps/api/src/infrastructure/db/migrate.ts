import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { loadEnvFileIfPresent } from "../env-file.js";
import { createDatabase, type Database } from "./client.js";

const migrationsFolder = fileURLToPath(
  new URL("./migrations", import.meta.url),
);

export async function runMigrations(
  database: Database,
  options: { migrationsSchema?: string } = {},
): Promise<void> {
  await migrate(database.db, { migrationsFolder, ...options });
}

async function main(): Promise<void> {
  loadEnvFileIfPresent(
    fileURLToPath(new URL("../../../../../.env.local", import.meta.url)),
  );
  const url = process.env.DATABASE_URL_UNPOOLED;
  if (!url) {
    throw new Error("DATABASE_URL_UNPOOLED is not set");
  }
  const database = createDatabase(url);
  try {
    await runMigrations(database);
    console.log("Migrations applied.");
  } finally {
    await database.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
