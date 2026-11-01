import { isIP } from "node:net";
import type { FastifyInstance } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    /** The client's IP address, normalized; used for rate limiting and audit. */
    clientAddress: string;
  }
}

/** Unwraps IPv4-mapped IPv6 ("::ffff:1.2.3.4") to plain IPv4. */
export function normalizedIp(address: string): string {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  return mapped?.[1] ?? address;
}

/**
 * Railway's edge supplies X-Real-IP. Trust it only on Railway: on any other
 * server a client could send it to pose as another address.
 */
export function registerClientAddress(
  app: FastifyInstance,
  options: { trustRailwayProxy: boolean },
): void {
  app.decorateRequest("clientAddress", "");
  app.addHook("onRequest", async (request) => {
    const real = request.headers["x-real-ip"];
    const candidate =
      typeof real === "string" && real.length <= 45 ? real.trim() : "";
    const railwayIp =
      options.trustRailwayProxy && !candidate.includes("%") && isIP(candidate)
        ? normalizedIp(candidate)
        : null;
    request.clientAddress = railwayIp ?? normalizedIp(request.ip);
  });
}
