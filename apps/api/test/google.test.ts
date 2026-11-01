import { authProvidersSchema } from "@nexus/shared";
import { handleOAuthUserInfo } from "better-auth/oauth2";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { accounts, users } from "../src/infrastructure/db/schema/index.js";
import { AuthTestClient } from "./auth-client.js";
import { nextTestAddress, testConfig, unusedDatabase } from "./test-config.js";
import { createTestDatabase, type TestDatabase } from "./test-database.js";

const google = { clientId: "test-client-id", clientSecret: "test-secret" };

describe("auth providers", () => {
  let app: FastifyInstance;
  afterEach(async () => {
    await app.close();
  });

  it("reports Google off when it isn't configured", async () => {
    app = await buildApp({ config: testConfig(), database: unusedDatabase() });
    const response = await app.inject({
      method: "GET",
      url: "/api/auth-providers",
    });
    expect(authProvidersSchema.parse(response.json())).toEqual({
      google: false,
    });
  });

  it("refuses Google sign-in when it isn't configured", async () => {
    app = await buildApp({ config: testConfig(), database: unusedDatabase() });
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/social",
      remoteAddress: nextTestAddress(),
      payload: { provider: "google" },
    });
    expect(response.statusCode).toBeGreaterThanOrEqual(400);
    expect(response.statusCode).toBeLessThan(500);
  });
});

describe.skipIf(!process.env.DATABASE_URL_UNPOOLED)(
  "Google sign-up and the allowlist",
  () => {
    let testDb: TestDatabase;
    let app: FastifyInstance;
    afterEach(async () => {
      await app.close();
      await testDb.cleanup();
    });

    // The OAuth callback creates the user through the internal adapter, which
    // runs the same database hooks; calling it simulates Google's callback.
    async function createGoogleUser(email: string) {
      const context = await app.auth.$context;
      return context.internalAdapter.createOAuthUser(
        { email, name: "Google User", emailVerified: true },
        {
          providerId: "google",
          accountId: `google-${email}`,
          accessToken: "token",
        },
      );
    }

    it("starts the Google flow with NEXUS's callback when configured", async () => {
      testDb = await createTestDatabase();
      app = await buildApp({
        config: testConfig({ google }),
        database: testDb.database,
      });
      const providers = await app.inject({
        method: "GET",
        url: "/api/auth-providers",
      });
      expect(providers.json()).toEqual({ google: true });

      const response = await app.inject({
        method: "POST",
        url: "/api/auth/sign-in/social",
        remoteAddress: nextTestAddress(),
        payload: { provider: "google" },
      });
      expect(response.statusCode).toBe(200);
      const url = new URL(response.json().url);
      expect(url.host).toBe("accounts.google.com");
      expect(url.searchParams.get("redirect_uri")).toBe(
        "http://localhost:3000/api/auth/callback/google",
      );
    });

    it("refuses an email that is not allowlisted", async () => {
      testDb = await createTestDatabase();
      app = await buildApp({
        config: testConfig({ google }),
        database: testDb.database,
      });
      await expect(createGoogleUser("stranger@example.com")).rejects.toThrow(
        "This account can't be created.",
      );
      const rows = await testDb.database.db
        .select()
        .from(users)
        .where(eq(users.email, "stranger@example.com"));
      expect(rows).toEqual([]);
    });

    it("doesn't link Google to an existing (unverified) password account", async () => {
      testDb = await createTestDatabase();
      app = await buildApp({
        config: testConfig({ google }),
        database: testDb.database,
      });
      await new AuthTestClient(app).signUp();
      const context = await app.auth.$context;
      const result = await handleOAuthUserInfo(
        { context } as never,
        {
          userInfo: {
            id: "google-sub",
            email: "owner@example.com",
            name: "Owner",
            emailVerified: true,
          },
          account: {
            providerId: "google",
            accountId: "google-sub",
            accessToken: "token",
          },
        } as never,
      );
      expect(result.error).toBe("account not linked");
      const linked = await testDb.database.db
        .select()
        .from(accounts)
        .where(eq(accounts.providerId, "google"));
      expect(linked).toEqual([]);
    });

    it("creates an allowlisted Google user", async () => {
      testDb = await createTestDatabase();
      app = await buildApp({
        config: testConfig({ google }),
        database: testDb.database,
      });
      await createGoogleUser("Owner@Example.com");
      const rows = await testDb.database.db.select().from(users);
      expect(rows.map((row) => row.email)).toEqual(["owner@example.com"]);
    });
  },
);
