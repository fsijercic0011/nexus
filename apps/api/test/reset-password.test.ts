import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { resetPassword } from "../src/cli/reset-password.js";
import { auditLogs } from "../src/infrastructure/db/schema/index.js";
import { AuthTestClient, TEST_PASSWORD } from "./auth-client.js";
import { testConfig } from "./test-config.js";
import { createTestDatabase, type TestDatabase } from "./test-database.js";

describe.skipIf(!process.env.DATABASE_URL_UNPOOLED)("resetPassword", () => {
  let testDb: TestDatabase;
  let app: FastifyInstance;

  beforeEach(async () => {
    testDb = await createTestDatabase();
    app = await buildApp({ config: testConfig(), database: testDb.database });
  });

  afterEach(async () => {
    await app.close();
    await testDb.cleanup();
  });

  it("sets a new random password and signs out every session", async () => {
    const owner = new AuthTestClient(app);
    await owner.signUp();
    expect(await owner.session()).not.toBeNull();

    const password = await resetPassword(
      testDb.database,
      app.auth,
      "Owner@Example.com",
    );
    expect(password).toHaveLength(20);

    expect(await owner.session()).toBeNull();
    const fresh = new AuthTestClient(app);
    expect(
      (await fresh.signIn("owner@example.com", TEST_PASSWORD)).statusCode,
    ).toBe(401);
    expect((await fresh.signIn("owner@example.com", password)).statusCode).toBe(
      200,
    );

    const audit = await testDb.database.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, "password.reset_by_cli"));
    expect(audit).toHaveLength(1);
  });

  it("rejects an unknown email", async () => {
    await expect(
      resetPassword(testDb.database, app.auth, "nobody@example.com"),
    ).rejects.toThrow("No account with that email");
  });
});
