import type { AppConfig } from "../src/infrastructure/config.js";
import {
  createDatabase,
  type Database,
} from "../src/infrastructure/db/client.js";

/** A complete AppConfig for tests; override what a test is about. */
export function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    nodeEnv: "test",
    host: "127.0.0.1",
    port: 0,
    databaseUrl: "postgres://unused",
    webDistDir: undefined,
    authSecret: "test-secret-test-secret-test-secret",
    authUrl: "http://localhost:3000",
    signupAllowedEmails: ["owner@example.com"],
    google: undefined,
    trustRailwayProxy: false,
    ...overrides,
  };
}

/** A database handle that never connects (postgres.js is lazy), for tests
 * that don't touch the database. */
export function unusedDatabase(): Database {
  return createDatabase("postgres://unused@127.0.0.1:1/unused");
}

let addressCounter = 0;

/** A fresh client address per call (10.0.0.0/8), so tests don't
 * share Better Auth's process-wide rate-limit buckets. */
export function nextTestAddress(): string {
  addressCounter += 1;
  return `10.${(addressCounter >> 16) & 255}.${(addressCounter >> 8) & 255}.${addressCounter & 255}`;
}
