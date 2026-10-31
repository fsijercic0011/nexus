import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";

let distDir: string;
let app: FastifyInstance;

beforeAll(async () => {
  distDir = mkdtempSync(join(tmpdir(), "nexus-web-"));
  writeFileSync(
    join(distDir, "index.html"),
    "<!doctype html><title>NEXUS</title>",
  );
  mkdirSync(join(distDir, "assets"));
  writeFileSync(join(distDir, "assets", "app.js"), "console.log('app');");
  app = await buildApp({
    config: {
      nodeEnv: "test",
      host: "127.0.0.1",
      port: 0,
      databaseUrl: "postgres://unused",
      webDistDir: distDir,
    },
    checkDatabase: async () => true,
  });
});

afterAll(async () => {
  await app.close();
  rmSync(distDir, { recursive: true, force: true });
});

const get = (url: string) => app.inject({ method: "GET", url });

describe("serving the web app", () => {
  it("serves index.html at /", async () => {
    const response = await get("/");
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
  });

  it("serves static assets", async () => {
    const response = await get("/assets/app.js");
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("javascript");
  });

  it("falls back to index.html for client routes", async () => {
    const response = await get("/inventory/items/123");
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain("<title>NEXUS</title>");
  });

  it("404s missing assets instead of returning HTML", async () => {
    const response = await get("/assets/missing.js");
    expect(response.statusCode).toBe(404);
    expect(response.body).not.toContain("<title>NEXUS</title>");
  });

  it("returns JSON 404 for unknown API routes", async () => {
    const response = await get("/api/nope");
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: "not_found" });
  });

  it("still serves the health route", async () => {
    const response = await get("/api/health");
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.json()).toEqual({ status: "ok", database: "ok" });
  });
});

describe("misconfigured web app", () => {
  it("fails startup when WEB_DIST_DIR has no index.html", async () => {
    await expect(
      buildApp({
        config: {
          nodeEnv: "test",
          host: "127.0.0.1",
          port: 0,
          databaseUrl: "postgres://unused",
          webDistDir: join(tmpdir(), "nexus-missing-dist"),
        },
        checkDatabase: async () => true,
      }),
    ).rejects.toThrow(/WEB_DIST_DIR/);
  });
});
