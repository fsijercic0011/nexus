import { type ChildProcess, execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

export const E2E_PORT = 3100;
export const E2E_EMAILS = [
  "owner+desktop@nexus.test",
  "owner+mobile@nexus.test",
];

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const webDistDir = fileURLToPath(new URL("../dist", import.meta.url));

function e2eDatabase(args: string): string {
  return execSync(
    `pnpm --silent --filter @nexus/api exec tsx test/e2e-database.ts ${args}`,
    { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
}

async function waitForServer(url: string, server: ChildProcess) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`API exited with code ${server.exitCode}`);
    }
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`API did not start at ${url}`);
}

/**
 * Runs the built API against its own throwaway database, so e2e never
 * touches the dev database. Returns the teardown that stops the server and
 * drops the database.
 */
export default async function globalSetup(): Promise<() => Promise<void>> {
  const { name, url } = JSON.parse(e2eDatabase("create")) as {
    name: string;
    url: string;
  };
  const server = spawn(
    process.execPath,
    [fileURLToPath(new URL("../../api/dist/server.js", import.meta.url))],
    {
      cwd: repoRoot,
      stdio: ["ignore", "inherit", "inherit"],
      env: {
        ...process.env,
        NODE_ENV: "test",
        PORT: String(E2E_PORT),
        DATABASE_URL: url,
        WEB_DIST_DIR: webDistDir,
        // Fixed, non-secret values: e2e runs against throwaway data only.
        BETTER_AUTH_SECRET: "e2e-only-secret-e2e-only-secret-0000",
        BETTER_AUTH_URL: `http://127.0.0.1:${E2E_PORT}`,
        SIGNUP_ALLOWED_EMAILS: E2E_EMAILS.join(","),
        // Every e2e request comes from 127.0.0.1; refused in production.
        AUTH_RATE_LIMIT: "off",
        GOOGLE_CLIENT_ID: "",
        GOOGLE_CLIENT_SECRET: "",
      },
    },
  );
  try {
    await waitForServer(`http://127.0.0.1:${E2E_PORT}/`, server);
  } catch (error) {
    server.kill();
    e2eDatabase(`drop ${name}`);
    throw error;
  }

  return async () => {
    const exited = new Promise((resolve) => server.once("exit", resolve));
    server.kill();
    await exited;
    e2eDatabase(`drop ${name}`);
  };
}
