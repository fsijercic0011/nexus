import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { users } from "../src/infrastructure/db/schema/index.js";
import { nextTestAddress, testConfig } from "./test-config.js";
import { createTestDatabase, type TestDatabase } from "./test-database.js";

const PASSWORD = "correct horse battery staple";

describe.skipIf(!process.env.DATABASE_URL_UNPOOLED)(
  "email + password sign-in",
  () => {
    let testDb: TestDatabase;
    let app: FastifyInstance;
    // Better Auth's in-memory rate limiter is shared by every instance in the
    // process, so each test signs in from its own address.
    let remoteAddress: string;

    beforeEach(async () => {
      testDb = await createTestDatabase();
      app = await buildApp({ config: testConfig(), database: testDb.database });
      remoteAddress = nextTestAddress();
    });

    afterEach(async () => {
      await app.close();
      await testDb.cleanup();
    });

    const signUp = (email: string) =>
      app.inject({
        method: "POST",
        url: "/api/auth/sign-up/email",
        remoteAddress,
        payload: { email, password: PASSWORD, name: "Owner" },
      });

    const signIn = (password: string, headers: Record<string, string> = {}) =>
      app.inject({
        method: "POST",
        url: "/api/auth/sign-in/email",
        remoteAddress,
        headers,
        payload: { email: "owner@example.com", password },
      });

    it("creates an allowlisted account, stored lower-cased, with a session cookie", async () => {
      const response = await signUp("Owner@Example.com");
      expect(response.statusCode).toBe(200);
      const rows = await testDb.database.db.select().from(users);
      expect(rows.map((row) => row.email)).toEqual(["owner@example.com"]);
      const cookie = [response.headers["set-cookie"]].flat().join("; ");
      expect(cookie).toContain("better-auth.session_token=");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toMatch(/SameSite=Lax/i);
    });

    it("rejects an email with surrounding whitespace as invalid (the web form trims)", async () => {
      const response = await signUp(" owner@example.com ");
      expect(response.statusCode).toBe(400);
      expect(await testDb.database.db.select().from(users)).toEqual([]);
    });

    it("refuses an email that is not on the allowlist", async () => {
      const response = await signUp("other@example.com");
      expect(response.statusCode).toBe(403);
      expect(response.json().message).toBe("This account can't be created.");
      const rows = await testDb.database.db
        .select()
        .from(users)
        .where(eq(users.email, "other@example.com"));
      expect(rows).toEqual([]);
    });

    it("signs in with the right password and refuses a wrong one", async () => {
      await signUp("owner@example.com");
      expect((await signIn(PASSWORD)).statusCode).toBe(200);
      expect((await signIn("wrong password")).statusCode).toBe(401);
    });

    it("rate-limits by the real address, ignoring a client-sent address header", async () => {
      await signUp("owner@example.com");
      const statuses: number[] = [];
      for (let attempt = 0; attempt < 6; attempt++) {
        const response = await signIn("wrong password", {
          "x-nexus-client-address": `198.51.100.${attempt}`,
          "x-real-ip": `203.0.113.${attempt}`,
        });
        statuses.push(response.statusCode);
      }
      expect(statuses).toContain(429);
    });
  },
);
