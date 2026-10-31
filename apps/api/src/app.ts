import Fastify, { type FastifyInstance } from "fastify";
import type { AppConfig } from "./infrastructure/config.js";
import {
  registerJsonNotFound,
  registerWebApp,
} from "./infrastructure/web-app.js";
import { healthRoutes } from "./modules/health/routes.js";

export type BuildAppOptions = {
  config: AppConfig;
  checkDatabase: () => Promise<boolean>;
};

/** Builds the Fastify instance. Performs no I/O, so tests can use app.inject(). */
export async function buildApp(
  options: BuildAppOptions,
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.config.nodeEnv === "test" ? false : { level: "info" },
  });

  await app.register(
    async (api) => {
      await api.register(healthRoutes, {
        checkDatabase: options.checkDatabase,
      });
    },
    { prefix: "/api" },
  );

  if (options.config.webDistDir) {
    await registerWebApp(app, options.config.webDistDir);
  } else {
    registerJsonNotFound(app);
  }

  return app;
}
