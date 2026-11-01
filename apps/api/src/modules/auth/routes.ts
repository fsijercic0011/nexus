import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { type Auth, CLIENT_ADDRESS_HEADER } from "./auth.js";

/** Builds the Fetch Request Better Auth expects from a Fastify request. The
 * client-address header is always replaced by the server's own value. */
function toFetchRequest(request: FastifyRequest, origin: string): Request {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value === undefined || key === CLIENT_ADDRESS_HEADER) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      headers.append(key, item);
    }
  }
  headers.set(CLIENT_ADDRESS_HEADER, request.clientAddress);
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  return new Request(new URL(request.url, origin), {
    method: request.method,
    headers,
    body:
      hasBody && request.body !== undefined
        ? JSON.stringify(request.body)
        : undefined,
  });
}

async function sendFetchResponse(
  reply: FastifyReply,
  response: Response,
): Promise<void> {
  reply.status(response.status);
  for (const [key, value] of response.headers) {
    if (key === "set-cookie") continue;
    reply.header(key, value);
  }
  const cookies = response.headers.getSetCookie();
  if (cookies.length > 0) reply.header("set-cookie", cookies);
  reply.send(response.body ? await response.text() : null);
}

/** Mounts Better Auth's endpoints under /api/auth/*. */
export async function authRoutes(
  app: FastifyInstance,
  options: { auth: Auth; origin: string },
): Promise<void> {
  app.route({
    method: ["GET", "POST"],
    url: "/auth/*",
    async handler(request, reply) {
      const response = await options.auth.handler(
        toFetchRequest(request, options.origin),
      );
      await sendFetchResponse(reply, response);
    },
  });
}
