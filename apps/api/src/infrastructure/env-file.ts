import { existsSync } from "node:fs";

/** Loads a dotenv file if it exists. Variables already set in the environment win. */
export function loadEnvFileIfPresent(path: string): void {
  if (existsSync(path)) {
    process.loadEnvFile(path);
  }
}
