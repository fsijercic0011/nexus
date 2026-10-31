import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

export type Database = {
  db: PostgresJsDatabase<typeof schema>;
  sql: postgres.Sql;
  close(): Promise<void>;
};

export function createDatabase(
  url: string,
  options: { searchPath?: string } = {},
): Database {
  const sql = postgres(url, {
    onnotice: () => {},
    // Neon ignores a bare search_path startup parameter; it honors -c options.
    ...(options.searchPath
      ? { connection: { options: `-c search_path=${options.searchPath}` } }
      : {}),
  });
  return {
    db: drizzle(sql, { schema }),
    sql,
    close: () => sql.end({ timeout: 5 }),
  };
}

export async function checkDatabase(database: Database): Promise<boolean> {
  try {
    await database.sql`select 1`;
    return true;
  } catch {
    return false;
  }
}
