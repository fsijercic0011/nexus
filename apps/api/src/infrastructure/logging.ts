import type { FastifyRequest } from "fastify";

/** The URL without its query string: OAuth callbacks carry single-use codes
 * and state there, which must never reach the logs. */
export function logSafeUrl(url: string): string {
  const query = url.indexOf("?");
  return query === -1 ? url : url.slice(0, query);
}

/** Fastify's request log serializer, with the query string dropped. */
export function serializeRequest(request: FastifyRequest) {
  return {
    method: request.method,
    url: logSafeUrl(request.url),
    remoteAddress: request.clientAddress || request.ip,
  };
}
