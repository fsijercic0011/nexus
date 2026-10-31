import { resolve } from "node:path";
import fastifyStatic from "@fastify/static";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

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

/** Serves the built SPA; unknown client routes fall back to index.html. */
export async function registerWebApp(
  app: FastifyInstance,
  distDir: string,
): Promise<void> {
  await app.register(fastifyStatic, {
    root: resolve(distDir),
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
