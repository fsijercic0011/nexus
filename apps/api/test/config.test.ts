import { describe, expect, it } from "vitest";
import { ConfigError, loadConfig } from "../src/infrastructure/config.js";

describe("loadConfig", () => {
  it("applies defaults", () => {
    expect(
      loadConfig({
        DATABASE_URL: "postgres://u:p@h/db",
        BETTER_AUTH_SECRET: "x".repeat(32),
      }),
    ).toEqual({
      nodeEnv: "development",
      port: 3000,
      host: "127.0.0.1",
      databaseUrl: "postgres://u:p@h/db",
      webDistDir: undefined,
      authSecret: "x".repeat(32),
      authUrl: "http://localhost:5173",
      signupAllowedEmails: [],
      google: undefined,
      trustRailwayProxy: false,
    });
  });

  it("binds all interfaces in production", () => {
    const config = loadConfig({
      NODE_ENV: "production",
      DATABASE_URL: "postgres://u:p@h/db",
      BETTER_AUTH_SECRET: "x".repeat(32),
      BETTER_AUTH_URL: "https://nexus.example.com",
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
    expect(
      loadConfig({ DATABASE_URL: url, BETTER_AUTH_SECRET: "x".repeat(32) })
        .databaseUrl,
    ).toBe(url);
  });
});

describe("auth configuration", () => {
  const base = {
    DATABASE_URL: "postgres://u:p@h/db",
    BETTER_AUTH_SECRET: "x".repeat(32),
  };

  it("parses the sign-up allowlist into trimmed lower-case emails", () => {
    const config = loadConfig({
      ...base,
      SIGNUP_ALLOWED_EMAILS: " Owner@Example.com , second@example.com,",
    });
    expect(config.signupAllowedEmails).toEqual([
      "owner@example.com",
      "second@example.com",
    ]);
  });

  it("allows nobody when the allowlist is blank", () => {
    expect(loadConfig(base).signupAllowedEmails).toEqual([]);
  });

  it("defaults the auth URL to the dev web server outside production", () => {
    expect(loadConfig(base).authUrl).toBe("http://localhost:5173");
  });

  it("requires BETTER_AUTH_URL in production", () => {
    expect(() => loadConfig({ ...base, NODE_ENV: "production" })).toThrow(
      /BETTER_AUTH_URL/,
    );
  });

  it("rejects a short secret, naming only the variable", () => {
    let error: unknown;
    try {
      loadConfig({ ...base, BETTER_AUTH_SECRET: "too-short-secret" });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(ConfigError);
    expect((error as ConfigError).message).toContain("BETTER_AUTH_SECRET");
    expect((error as ConfigError).message).not.toContain("too-short-secret");
  });

  it("needs both Google variables or neither", () => {
    expect(() => loadConfig({ ...base, GOOGLE_CLIENT_ID: "id" })).toThrow(
      /GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET/,
    );
    expect(loadConfig(base).google).toBeUndefined();
    expect(
      loadConfig({
        ...base,
        GOOGLE_CLIENT_ID: "id",
        GOOGLE_CLIENT_SECRET: "secret",
      }).google,
    ).toEqual({ clientId: "id", clientSecret: "secret" });
  });

  it("trusts the Railway proxy only on Railway", () => {
    expect(loadConfig(base).trustRailwayProxy).toBe(false);
    expect(
      loadConfig({ ...base, RAILWAY_ENVIRONMENT_ID: "env" }).trustRailwayProxy,
    ).toBe(true);
    expect(
      loadConfig({ ...base, RAILWAY_ENVIRONMENT: "production" })
        .trustRailwayProxy,
    ).toBe(true);
  });
});
