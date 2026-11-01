import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

const envFile = new URL("../../.env.local", import.meta.url);
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/infrastructure/db/schema/index.ts",
  out: "./src/infrastructure/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? "",
  },
});
