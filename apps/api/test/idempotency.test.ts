import { eq, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import {
  events,
  idempotencyKeys,
} from "../src/infrastructure/db/schema/index.js";
import { AuthTestClient } from "./auth-client.js";
import { testConfig } from "./test-config.js";
import { createTestDatabase, type TestDatabase } from "./test-database.js";

describe.skipIf(!process.env.DATABASE_URL_UNPOOLED)("Idempotency-Key", () => {
  let testDb: TestDatabase;
  let app: FastifyInstance;
  let owner: AuthTestClient;

  beforeEach(async () => {
    testDb = await createTestDatabase();
    app = await buildApp({ config: testConfig(), database: testDb.database });
    owner = new AuthTestClient(app);
    await owner.signUp();
    await owner.request("GET", "/api/me");
  });

  afterEach(async () => {
    await app.close();
    await testDb.cleanup();
  });

  const rename = (name: string, key: string) =>
    owner.request(
      "PATCH",
      "/api/household",
      { name },
      { "idempotency-key": key },
    );

  const renameEvents = async () =>
    testDb.database.db
      .select()
      .from(events)
      .where(eq(events.eventType, "household.renamed"));

  it("replays the first response for a repeated key without writing again", async () => {
    const first = await rename("Home", "key-1");
    const second = await rename("Home", "key-1");
    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(second.json()).toEqual(first.json());
    expect(second.headers["idempotent-replayed"]).toBe("true");
    expect(first.headers["idempotent-replayed"]).toBeUndefined();
    expect(await renameEvents()).toHaveLength(1);
  });

  it("rejects the same key with a different body", async () => {
    await rename("Home", "key-2");
    const response = await rename("Cottage", "key-2");
    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe("idempotency_key_reused");
    expect(await renameEvents()).toHaveLength(1);
  });

  it("never writes twice for concurrent duplicates", async () => {
    const responses = await Promise.all([
      rename("Home", "key-3"),
      rename("Home", "key-3"),
    ]);
    const statuses = responses.map((r) => r.statusCode).sort();
    expect(statuses[0]).toBe(200);
    expect([200, 409]).toContain(statuses[1]);
    expect(await renameEvents()).toHaveLength(1);
  });

  it("rejects an over-long key", async () => {
    const response = await rename("Home", "k".repeat(129));
    expect(response.statusCode).toBe(400);
  });

  it("drops keys older than 24 hours on the next insert", async () => {
    await rename("Home", "old-key");
    await testDb.database.db
      .update(idempotencyKeys)
      .set({ createdAt: sql`now() - interval '25 hours'` });
    await rename("Cottage", "new-key");
    const keys = await testDb.database.db
      .select({ key: idempotencyKeys.key })
      .from(idempotencyKeys);
    expect(keys.map((row) => row.key)).toEqual(["new-key"]);
  });
});
