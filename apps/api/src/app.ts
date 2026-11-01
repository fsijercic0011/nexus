import Fastify, { type FastifyInstance } from "fastify";
import { registerClientAddress } from "./infrastructure/client-address.js";
import type { AppConfig } from "./infrastructure/config.js";
import { checkDatabase, type Database } from "./infrastructure/db/client.js";
import { registerErrorHandler } from "./infrastructure/errors.js";
import { registerIdempotency } from "./infrastructure/idempotency.js";
import { serializeRequest } from "./infrastructure/logging.js";
import {
  registerJsonNotFound,
  registerWebApp,
} from "./infrastructure/web-app.js";
import { type Auth, createAuth } from "./modules/auth/auth.js";
import { authProviderRoutes } from "./modules/auth/providers.js";
import { authRoutes } from "./modules/auth/routes.js";
import { healthRoutes } from "./modules/health/routes.js";
import { requireMember } from "./modules/households/require-member.js";
import { householdRoutes } from "./modules/households/routes.js";

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
    logger:
      config.nodeEnv === "test"
        ? false
        : { level: "info", serializers: { req: serializeRequest } },
  });
  registerClientAddress(app, { trustRailwayProxy: config.trustRailwayProxy });
  const auth = createAuth(database, config);
  app.decorate("auth", auth);

  await app.register(
    async (api) => {
      registerErrorHandler(api);
      await api.register(healthRoutes, {
        checkDatabase: options.checkDatabase ?? (() => checkDatabase(database)),
      });
      await api.register(authRoutes, { auth, origin: config.authUrl });
      await api.register(authProviderRoutes, { google: !!config.google });
      // Everything else needs a signed-in household member.
      await api.register(async (member) => {
        requireMember(member, { auth, db: database.db });
        registerIdempotency(member, { db: database.db });
        await member.register(householdRoutes, { db: database.db });
      });
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
