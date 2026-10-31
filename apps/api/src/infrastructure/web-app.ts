import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import fastifyStatic from "@fastify/static";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ConfigError } from "./config.js";

function sendNotFound(reply: FastifyReply) {
  return reply.code(404).send({ error: "not_found" });
}

/** True for client-side routes: GET, outside /api, and no file extension. */
function isClientRoute(request: FastifyRequest): boolean {
  const path = request.url.split("?")[0] ?? "";
  if (request.method !== "GET" || path === "/api" || path.startsWith("/api/")) {
    return false;
  }
  const lastSegment = path.slice(path.lastIndexOf("/") + 1);
  return !lastSegment.includes(".");
}

/**
 * Serves the built SPA; unknown client routes fall back to index.html.
 * Throws when the build is missing, so a bad WEB_DIST_DIR fails startup
 * instead of serving 404s behind a healthy /api/health.
 */
export async function registerWebApp(
  app: FastifyInstance,
  distDir: string,
): Promise<void> {
  const root = resolve(distDir);
  if (!existsSync(join(root, "index.html"))) {
    throw new ConfigError(["WEB_DIST_DIR"]);
  }

  await app.register(fastifyStatic, {
    root,
    wildcard: false,
  });

  app.setNotFoundHandler((request, reply) => {
    if (isClientRoute(request)) {
      return reply.sendFile("index.html");
    }
    return sendNotFound(reply);
  });
}

export function registerJsonNotFound(app: FastifyInstance): void {
  app.setNotFoundHandler((_request, reply) => sendNotFound(reply));
}
