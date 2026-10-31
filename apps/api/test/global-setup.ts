import "./setup-env.js";
import { createDatabase } from "../src/infrastructure/db/client.js";
import { pruneStaleTestSchemas } from "./test-database.js";

/** Drops `test_*` schemas left behind by crashed runs before the suite starts. */
export default async function setup(): Promise<void> {
  const url = process.env.DATABASE_URL_UNPOOLED;
  if (!url) return;
  const admin = createDatabase(url);
  try {
    await pruneStaleTestSchemas(admin);
  } finally {
    await admin.close();
  }
}
