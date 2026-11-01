import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import type { Db } from "../../infrastructure/db/transaction.js";
import { ApiError } from "../../infrastructure/errors.js";
import type { Auth } from "../auth/auth.js";
import type { MemberContext } from "./authorization.js";
import { ensureMembership } from "./membership.js";

declare module "fastify" {
  interface FastifyRequest {
    /** The acting member; set on every route in a requireMember scope. */
    member: MemberContext;
  }
}

/** Adds a preHandler that resolves the session to a household member, or
 * answers 401. Every NEXUS route except health and auth sits behind it. */
export function requireMember(
  app: FastifyInstance,
  options: { auth: Auth; db: Db },
): void {
  app.decorateRequest("member", null as unknown as MemberContext);
  app.addHook("preHandler", async (request, reply) => {
    const { headers, response: session } = await options.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
      returnHeaders: true,
    });
    // Better Auth extends an ageing session here; pass its refreshed cookie
    // on, or the browser's copy would still expire on the original date.
    const refreshed = headers.getSetCookie();
    if (refreshed.length > 0) reply.header("set-cookie", refreshed);
    if (!session) {
      throw new ApiError(401, "unauthenticated", "Sign in to continue.");
    }
    request.member = await ensureMembership(options.db, session.user);
  });
}
