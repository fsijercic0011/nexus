import { describe, expect, it } from "vitest";
import { ConfigError, loadConfig } from "../src/infrastructure/config.js";

describe("loadConfig", () => {
  it("applies defaults", () => {
    expect(loadConfig({ DATABASE_URL: "postgres://u:p@h/db" })).toEqual({
      nodeEnv: "development",
      port: 3000,
      host: "127.0.0.1",
      databaseUrl: "postgres://u:p@h/db",
      webDistDir: undefined,
    });
  });

  it("binds all interfaces in production", () => {
    const config = loadConfig({
      NODE_ENV: "production",
      DATABASE_URL: "postgres://u:p@h/db",
    });
    expect(config.host).toBe("0.0.0.0");
  });

  it("names missing variables without leaking values", () => {
    let error: unknown;
    try {
      loadConfig({ PORT: "abc", HOST: "secret-host-value" });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(ConfigError);
    const message = (error as ConfigError).message;
    expect(message).toContain("DATABASE_URL");
    expect(message).toContain("PORT");
    expect(message).not.toContain("secret-host-value");
    expect(message).not.toContain("abc");
  });
});

describe("database URL validation", () => {
  it("rejects a malformed DATABASE_URL without echoing it", () => {
    let error: unknown;
    try {
      loadConfig({ DATABASE_URL: "postgres://owner:ab/cd@host/db" });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(ConfigError);
    expect((error as ConfigError).message).toContain("DATABASE_URL");
    expect((error as ConfigError).message).not.toContain("ab/cd");
  });

  it("rejects a non-Postgres URL", () => {
    expect(() => loadConfig({ DATABASE_URL: "mysql://u:p@host/db" })).toThrow(
      ConfigError,
    );
  });

  it("accepts a URL with an encoded password", () => {
    const url = "postgresql://owner:ab%2Fcd@host.example/db?sslmode=require";
    expect(loadConfig({ DATABASE_URL: url }).databaseUrl).toBe(url);
  });
});
