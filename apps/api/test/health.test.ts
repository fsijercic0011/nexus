import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import type { AppConfig } from "../src/infrastructure/config.js";

const config: AppConfig = {
  nodeEnv: "test",
  host: "127.0.0.1",
  port: 0,
  databaseUrl: "postgres://unused",
  webDistDir: undefined,
};

describe("GET /api/health", () => {
  it("reports ok when the database answers", async () => {
    const app = await buildApp({ config, checkDatabase: async () => true });
    const response = await app.inject({ method: "GET", url: "/api/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", database: "ok" });
    await app.close();
  });

  it("reports degraded when the database check throws", async () => {
    const app = await buildApp({
      config,
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
      checkDatabase: () => new Promise<boolean>(() => {}),
    });
    const started = Date.now();
    const response = await app.inject({ method: "GET", url: "/api/health" });
    expect(Date.now() - started).toBeLessThan(2500);
    expect(response.statusCode).toBe(503);
    await app.close();
  });
});
