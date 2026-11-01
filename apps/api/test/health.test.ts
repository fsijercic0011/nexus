import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { checkDatabase } from "../src/infrastructure/db/client.js";
import { testConfig, unusedDatabase } from "./test-config.js";
import { createTestDatabase } from "./test-database.js";

const config = testConfig();

describe("GET /api/health", () => {
  it("reports ok when the database answers", async () => {
    const app = await buildApp({
      config,
      database: unusedDatabase(),
      checkDatabase: async () => true,
    });
    const response = await app.inject({ method: "GET", url: "/api/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", database: "ok" });
    await app.close();
  });

  it("reports degraded when the database check throws", async () => {
    const app = await buildApp({
      config,
      database: unusedDatabase(),
      checkDatabase: async () => {
        throw new Error("connection refused");
      },
    });
    const response = await app.inject({ method: "GET", url: "/api/health" });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      status: "degraded",
      database: "unavailable",
    });
    await app.close();
  });

  it("does not hang on a stuck database", async () => {
    const app = await buildApp({
      config,
      database: unusedDatabase(),
      checkDatabase: () => new Promise<boolean>(() => {}),
    });
    const started = Date.now();
    const response = await app.inject({ method: "GET", url: "/api/health" });
    expect(Date.now() - started).toBeLessThan(2500);
    expect(response.statusCode).toBe(503);
    await app.close();
  });
});

describe.skipIf(!process.env.DATABASE_URL_UNPOOLED)(
  "GET /api/health with a real database",
  () => {
    it("reports ok against the real database", async () => {
      const { database, cleanup } = await createTestDatabase();
      const app = await buildApp({
        config,
        database,
        checkDatabase: () => checkDatabase(database),
      });
      try {
        const response = await app.inject({
          method: "GET",
          url: "/api/health",
        });
        expect(response.statusCode).toBe(200);
      } finally {
        await app.close();
        await cleanup();
      }
    });
  },
);
