import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import { loadConfig } from "./infrastructure/config.js";
import { loadEnvFileIfPresent } from "./infrastructure/env-file.js";

loadEnvFileIfPresent(
  fileURLToPath(new URL("../../../.env.local", import.meta.url)),
);

const config = loadConfig(process.env);
const app = await buildApp({ config, checkDatabase: async () => false });

await app.listen({ host: config.host, port: config.port });
