import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { AuthTestClient, TEST_PASSWORD, totpCode } from "./auth-client.js";
import { testConfig } from "./test-config.js";
import { createTestDatabase, type TestDatabase } from "./test-database.js";

describe.skipIf(!process.env.DATABASE_URL_UNPOOLED)("TOTP two-factor", () => {
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

  async function enableTwoFactor(): Promise<{
    totpURI: string;
    backupCodes: string[];
  }> {
    const enabled = await owner.request("POST", "/api/auth/two-factor/enable", {
      password: TEST_PASSWORD,
    });
    expect(enabled.statusCode).toBe(200);
    const body = enabled.json();
    const verified = await owner.request(
      "POST",
      "/api/auth/two-factor/verify-totp",
      { code: totpCode(body.totpURI) },
    );
    expect(verified.statusCode).toBe(200);
    return body;
  }

  it("enables with the password, returning a NEXUS TOTP URI and 10 backup codes", async () => {
    const { totpURI, backupCodes } = await enableTwoFactor();
    expect(totpURI).toMatch(/^otpauth:\/\/totp\/NEXUS:/);
    expect(backupCodes).toHaveLength(10);
    const session = await owner.request("GET", "/api/auth/get-session");
    expect(session.json().user.twoFactorEnabled).toBe(true);
  });

  it("asks for a code at the next password sign-in", async () => {
    const { totpURI } = await enableTwoFactor();
    await owner.signOut();

    const signIn = await owner.signIn();
    expect(signIn.json().twoFactorRedirect).toBe(true);
    expect(await owner.session()).toBeNull();

    const wrong = await owner.request(
      "POST",
      "/api/auth/two-factor/verify-totp",
      { code: "000000" },
    );
    expect(wrong.statusCode).toBe(401);
    expect(await owner.session()).toBeNull();

    const right = await owner.request(
      "POST",
      "/api/auth/two-factor/verify-totp",
      { code: totpCode(totpURI) },
    );
    expect(right.statusCode).toBe(200);
    expect((await owner.session())?.user).toBeDefined();
  });

  it("accepts a backup code once", async () => {
    const { backupCodes } = await enableTwoFactor();
    const code = backupCodes[0];
    await owner.signOut();

    await owner.signIn();
    const first = await owner.request(
      "POST",
      "/api/auth/two-factor/verify-backup-code",
      { code },
    );
    expect(first.statusCode).toBe(200);
    await owner.signOut();

    await owner.signIn();
    const second = await owner.request(
      "POST",
      "/api/auth/two-factor/verify-backup-code",
      { code },
    );
    expect(second.statusCode).toBe(401);
  });

  it("needs the password to turn it off", async () => {
    await enableTwoFactor();
    const wrong = await owner.request("POST", "/api/auth/two-factor/disable", {
      password: "wrong password",
    });
    expect(wrong.statusCode).toBeGreaterThanOrEqual(400);
    const right = await owner.request("POST", "/api/auth/two-factor/disable", {
      password: TEST_PASSWORD,
    });
    expect(right.statusCode).toBe(200);
  });
});
