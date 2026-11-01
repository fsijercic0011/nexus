import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { auditLogs } from "../src/infrastructure/db/schema/index.js";
import { AuthTestClient, TEST_PASSWORD, totpCode } from "./auth-client.js";
import { testConfig } from "./test-config.js";
import { createTestDatabase, type TestDatabase } from "./test-database.js";

describe.skipIf(!process.env.DATABASE_URL_UNPOOLED)("account audit", () => {
  let testDb: TestDatabase;
  let app: FastifyInstance;
  let owner: AuthTestClient;

  beforeEach(async () => {
    testDb = await createTestDatabase();
    app = await buildApp({ config: testConfig(), database: testDb.database });
    owner = new AuthTestClient(app);
    await owner.signUp();
  });

  afterEach(async () => {
    await app.close();
    await testDb.cleanup();
  });

  const actions = async () =>
    (await testDb.database.db.select().from(auditLogs)).filter(
      (row) => row.action !== "member.added",
    );

  it("records a password change with actor and client address", async () => {
    const response = await owner.request(
      "POST",
      "/api/auth/change-password",
      { currentPassword: TEST_PASSWORD, newPassword: "a new long password" },
      { "user-agent": "audit-test" },
    );
    expect(response.statusCode).toBe(200);
    const rows = await actions();
    expect(rows.map((row) => row.action)).toEqual(["password.changed"]);
    expect(rows[0]?.actorUserId).toBeTruthy();
    expect(rows[0]?.clientIp).toBe(owner.remoteAddress);
    expect(rows[0]?.userAgent).toBe("audit-test");
  });

  it("does not record a failed password change", async () => {
    await owner.request("POST", "/api/auth/change-password", {
      currentPassword: "wrong password",
      newPassword: "a new long password",
    });
    expect(await actions()).toEqual([]);
  });

  it("records two-factor being turned on and off", async () => {
    const enabled = await owner.request("POST", "/api/auth/two-factor/enable", {
      password: TEST_PASSWORD,
    });
    await owner.request("POST", "/api/auth/two-factor/verify-totp", {
      code: totpCode(enabled.json().totpURI),
    });
    await owner.request("POST", "/api/auth/two-factor/disable", {
      password: TEST_PASSWORD,
    });
    expect((await actions()).map((row) => row.action)).toEqual([
      "2fa.enabled",
      "2fa.disabled",
    ]);
  });

  it("records signing out everywhere", async () => {
    const response = await owner.request(
      "POST",
      "/api/auth/revoke-sessions",
      {},
    );
    expect(response.statusCode).toBe(200);
    expect((await actions()).map((row) => row.action)).toEqual([
      "sessions.revoked",
    ]);
  });
});
