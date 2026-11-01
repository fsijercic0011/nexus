import { meSchema } from "@nexus/shared";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import {
  auditLogs,
  events,
  householdMembers,
} from "../src/infrastructure/db/schema/index.js";
import { AuthTestClient } from "./auth-client.js";
import { testConfig } from "./test-config.js";
import { createTestDatabase, type TestDatabase } from "./test-database.js";

describe.skipIf(!process.env.DATABASE_URL_UNPOOLED)(
  "me and household routes",
  () => {
    let testDb: TestDatabase;
    let app: FastifyInstance;
    let owner: AuthTestClient;

    beforeEach(async () => {
      testDb = await createTestDatabase();
      app = await buildApp({
        config: testConfig({
          signupAllowedEmails: ["owner@example.com", "second@example.com"],
        }),
        database: testDb.database,
      });
      owner = new AuthTestClient(app);
      await owner.signUp();
    });

    afterEach(async () => {
      await app.close();
      await testDb.cleanup();
    });

    const rename = (client: AuthTestClient, name: unknown) =>
      client.request("PATCH", "/api/household", { name });

    it("describes the signed-in owner as admin of their household", async () => {
      const response = await owner.request("GET", "/api/me");
      expect(response.statusCode).toBe(200);
      const me = meSchema.parse(response.json());
      expect(me.user.email).toBe("owner@example.com");
      expect(me.user.twoFactorEnabled).toBe(false);
      expect(me.household.name).toBe("My household");
      expect(me.role).toBe("admin");
    });

    it("answers 401 without a session", async () => {
      const response = await app.inject({ method: "GET", url: "/api/me" });
      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        error: {
          code: "unauthenticated",
          message: "Sign in to continue.",
        },
      });
    });

    it("renames only the caller's own household", async () => {
      const second = new AuthTestClient(app);
      await second.signUp("second@example.com", "Second");

      expect((await rename(owner, "Home")).statusCode).toBe(200);
      const ownerMe = meSchema.parse(
        (await owner.request("GET", "/api/me")).json(),
      );
      const secondMe = meSchema.parse(
        (await second.request("GET", "/api/me")).json(),
      );
      expect(ownerMe.household.name).toBe("Home");
      expect(secondMe.household.name).toBe("My household");
      expect(secondMe.household.id).not.toBe(ownerMe.household.id);
    });

    it("trims names and accepts emoji and non-Latin text", async () => {
      const response = await rename(owner, "  Kuća 🏠  ");
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ name: "Kuća 🏠" });
    });

    it("rejects blank and over-long names with a readable message", async () => {
      const blank = await rename(owner, "   ");
      expect(blank.statusCode).toBe(400);
      expect(blank.json().error).toEqual({
        code: "validation_failed",
        message: "Enter a name.",
      });
      const long = await rename(owner, "x".repeat(101));
      expect(long.statusCode).toBe(400);
      expect(long.json().error.message).toBe("Use at most 100 characters.");
    });

    it("records the rename as an event and an audit entry", async () => {
      await rename(owner, "Home");
      const { db } = testDb.database;
      const renamed = await db
        .select()
        .from(events)
        .where(eq(events.eventType, "household.renamed"));
      expect(renamed.map((row) => row.payload)).toEqual([
        { from: "My household", to: "Home" },
      ]);
      const audit = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.action, "household.renamed"));
      expect(audit).toHaveLength(1);
      expect(audit[0]?.before).toEqual({ name: "My household" });
      expect(audit[0]?.after).toEqual({ name: "Home" });
    });

    it("refuses a rename by a non-admin member", async () => {
      await owner.request("GET", "/api/me");
      await testDb.database.db.update(householdMembers).set({ role: "member" });
      const response = await rename(owner, "Home");
      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe("forbidden");
    });

    it("renames the profile with the same rules", async () => {
      const response = await owner.request("PATCH", "/api/me/profile", {
        name: "  Cassius  ",
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ name: "Cassius" });
      const me = meSchema.parse((await owner.request("GET", "/api/me")).json());
      expect(me.user.name).toBe("Cassius");
      const blank = await owner.request("PATCH", "/api/me/profile", {
        name: "",
      });
      expect(blank.statusCode).toBe(400);
    });
  },
);
