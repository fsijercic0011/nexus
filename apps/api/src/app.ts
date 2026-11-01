import Fastify, { type FastifyInstance } from "fastify";
import { registerClientAddress } from "./infrastructure/client-address.js";
import type { AppConfig } from "./infrastructure/config.js";
import { checkDatabase, type Database } from "./infrastructure/db/client.js";
import {
  registerJsonNotFound,
  registerWebApp,
} from "./infrastructure/web-app.js";
import { type Auth, createAuth } from "./modules/auth/auth.js";
import { authRoutes } from "./modules/auth/routes.js";
import { healthRoutes } from "./modules/health/routes.js";

declare module "fastify" {
  interface FastifyInstance {
    auth: Auth;
  }
}

export type BuildAppOptions = {
  config: AppConfig;
  database: Database;
  /** Defaults to a `select 1` against `database`. */
  checkDatabase?: () => Promise<boolean>;
};

/** Builds the Fastify instance. Performs no I/O (postgres.js connects lazily),
 * so tests can use app.inject(). */
export async function buildApp(
  options: BuildAppOptions,
): Promise<FastifyInstance> {
  const { config, database } = options;
  const app = Fastify({
    logger: config.nodeEnv === "test" ? false : { level: "info" },
  });
  registerClientAddress(app, { trustRailwayProxy: config.trustRailwayProxy });
  const auth = createAuth(database, config);
  app.decorate("auth", auth);

  await app.register(
    async (api) => {
      await api.register(healthRoutes, {
        checkDatabase: options.checkDatabase ?? (() => checkDatabase(database)),
      });
      await api.register(authRoutes, { auth, origin: config.authUrl });
    },
    { prefix: "/api" },
  );

  if (config.webDistDir) {
    await registerWebApp(app, config.webDistDir);
  } else {
    registerJsonNotFound(app);
  }

  return app;
}
