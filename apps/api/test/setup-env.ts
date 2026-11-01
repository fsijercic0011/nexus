import { fileURLToPath } from "node:url";
import { loadEnvFileIfPresent } from "../src/infrastructure/env-file.js";

loadEnvFileIfPresent(
  fileURLToPath(new URL("../../../.env.local", import.meta.url)),
);
