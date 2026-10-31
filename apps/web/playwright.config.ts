import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const webDistDir = fileURLToPath(new URL("./dist", import.meta.url));

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://127.0.0.1:${port}` },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm --filter @nexus/api start",
    // Wait on the page, not /api/health: readiness must not depend on the database.
    url: `http://127.0.0.1:${port}/`,
    env: { PORT: String(port), WEB_DIST_DIR: webDistDir },
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
