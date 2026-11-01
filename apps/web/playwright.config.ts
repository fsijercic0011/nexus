import { defineConfig, devices } from "@playwright/test";
import { E2E_PORT } from "./e2e/global-setup";

// The global setup starts the built API (serving apps/web/dist) on its own
// throwaway database and stops it afterwards. Run `pnpm build` first.
export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  globalSetup: "./e2e/global-setup.ts",
  use: { baseURL: `http://127.0.0.1:${E2E_PORT}` },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
