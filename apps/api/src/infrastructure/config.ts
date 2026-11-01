import { z } from "zod";
import { normalizeEmail } from "../modules/auth/allowlist.js";

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  host: string;
  port: number;
  databaseUrl: string;
  webDistDir: string | undefined;
  /** BETTER_AUTH_SECRET: signs sessions; at least 32 characters. */
  authSecret: string;
  /** BETTER_AUTH_URL: the origin people open NEXUS on. */
  authUrl: string;
  /** SIGNUP_ALLOWED_EMAILS: only these emails can create an account. */
  signupAllowedEmails: string[];
  google: { clientId: string; clientSecret: string } | undefined;
  /** On Railway, trust the edge's X-Real-IP header for the client address. */
  trustRailwayProxy: boolean;
};

export class ConfigError extends Error {
  constructor(variables: string[]) {
    super(`Invalid or missing environment variables: ${variables.join(", ")}`);
    this.name = "ConfigError";
  }
}

/**
 * True for a well-formed postgres:// URL. postgres.js parses malformed URLs
 * loosely (e.g. an unencoded "/" in the password) and then reports the
 * password as a hostname, so reject them before they reach it.
 */
function isPostgresUrl(value: string): boolean {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  return (
    (url.protocol === "postgres:" || url.protocol === "postgresql:") &&
    url.hostname !== "" &&
    !/[:@]/.test(url.hostname)
  );
}

const postgresUrl = z.string().min(1).refine(isPostgresUrl);

/** Validates a Postgres URL from the environment; errors name the variable only. */
export function parseDatabaseUrl(
  name: string,
  value: string | undefined,
): string {
  if (value === undefined || !postgresUrl.safeParse(value).success) {
    throw new ConfigError([name]);
  }
  return value;
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  HOST: z.string().min(1).optional(),
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  DATABASE_URL: postgresUrl,
  WEB_DIST_DIR: z.string().min(1).optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().optional(),
  SIGNUP_ALLOWED_EMAILS: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  RAILWAY_ENVIRONMENT_ID: z.string().min(1).optional(),
  RAILWAY_ENVIRONMENT: z.string().min(1).optional(),
});

const DEV_AUTH_URL = "http://localhost:5173";

/** Reads configuration from the environment. Errors name variables, never values. */
export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  const blankToUndefined = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [
      key,
      value === "" ? undefined : value,
    ]),
  );
  const result = envSchema.safeParse(blankToUndefined);
  if (!result.success) {
    const names = [
      ...new Set(result.error.issues.map((issue) => String(issue.path[0]))),
    ];
    throw new ConfigError(names);
  }
  const parsed = result.data;
  const missing: string[] = [];
  if (parsed.NODE_ENV === "production" && !parsed.BETTER_AUTH_URL) {
    missing.push("BETTER_AUTH_URL");
  }
  if (!parsed.GOOGLE_CLIENT_ID !== !parsed.GOOGLE_CLIENT_SECRET) {
    missing.push("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET");
  }
  if (missing.length > 0) throw new ConfigError(missing);
  return {
    nodeEnv: parsed.NODE_ENV,
    host:
      parsed.HOST ??
      (parsed.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1"),
    port: parsed.PORT,
    databaseUrl: parsed.DATABASE_URL,
    webDistDir: parsed.WEB_DIST_DIR,
    authSecret: parsed.BETTER_AUTH_SECRET,
    authUrl: parsed.BETTER_AUTH_URL ?? DEV_AUTH_URL,
    signupAllowedEmails: (parsed.SIGNUP_ALLOWED_EMAILS ?? "")
      .split(",")
      .map(normalizeEmail)
      .filter((email) => email !== ""),
    google:
      parsed.GOOGLE_CLIENT_ID && parsed.GOOGLE_CLIENT_SECRET
        ? {
            clientId: parsed.GOOGLE_CLIENT_ID,
            clientSecret: parsed.GOOGLE_CLIENT_SECRET,
          }
        : undefined,
    trustRailwayProxy: Boolean(
      parsed.RAILWAY_ENVIRONMENT_ID || parsed.RAILWAY_ENVIRONMENT,
    ),
  };
}
