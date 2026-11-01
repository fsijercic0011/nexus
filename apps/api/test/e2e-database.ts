// The e2e harness's database: `create` makes a throwaway, migrated test
// database and prints its name and URL as JSON on stdout; `drop <name>`
// removes it. Run with tsx; never in production.
import "./setup-env.js";
import { createTestDatabase, dropTestDatabase } from "./test-database.js";

const [command, name] = process.argv.slice(2);

if (command === "create") {
  const { database, databaseName } = await createTestDatabase();
  await database.close();
  const url = new URL(process.env.DATABASE_URL_UNPOOLED ?? "");
  url.pathname = `/${databaseName}`;
  process.stdout.write(
    JSON.stringify({ name: databaseName, url: url.toString() }),
  );
} else if (command === "drop" && name) {
  await dropTestDatabase(name);
} else {
  console.error("Usage: e2e-database.ts create | drop <name>");
  process.exit(2);
}
