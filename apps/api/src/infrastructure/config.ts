import { z } from "zod";

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  host: string;
  port: number;
  databaseUrl: string;
  webDistDir: string | undefined;
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
});

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
  return {
    nodeEnv: parsed.NODE_ENV,
    host:
      parsed.HOST ??
      (parsed.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1"),
    port: parsed.PORT,
    databaseUrl: parsed.DATABASE_URL,
    webDistDir: parsed.WEB_DIST_DIR,
  };
}
