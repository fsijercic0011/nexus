import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import { loadConfig } from "./infrastructure/config.js";
import { checkDatabase, createDatabase } from "./infrastructure/db/client.js";
import { loadEnvFileIfPresent } from "./infrastructure/env-file.js";

loadEnvFileIfPresent(
  fileURLToPath(new URL("../../../.env.local", import.meta.url)),
);

const config = loadConfig(process.env);
const database = createDatabase(config.databaseUrl);
const app = await buildApp({
  config,
  checkDatabase: () => checkDatabase(database),
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    await app.close();
    await database.close();
    process.exit(0);
  });
}

await app.listen({ host: config.host, port: config.port });
