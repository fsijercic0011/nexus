import type { Database } from "./client.js";

export type Db = Database["db"];
/** A Drizzle transaction handle. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type DbOrTx = Db | Tx;

/** Runs `fn` in one database transaction: everything it writes commits
 * together or not at all. */
export function withTransaction<T>(
  db: Db,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(fn);
}
