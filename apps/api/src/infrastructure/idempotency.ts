import { createHash } from "node:crypto";
import { and, eq, lt, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { idempotencyKeys } from "./db/schema/index.js";
import type { Db } from "./db/transaction.js";
import { ApiError, errorBody } from "./errors.js";

declare module "fastify" {
  interface FastifyContextConfig {
    /** Honour an Idempotency-Key header on this route. */
    idempotent?: boolean;
  }
  interface FastifyRequest {
    idempotencyKey: string | null;
  }
}

export const MAX_IDEMPOTENCY_KEY_LENGTH = 128;
const RETENTION = sql`interval '24 hours'`;

function requestHash(method: string, url: string, body: unknown): string {
  return createHash("sha256")
    .update(`${method} ${url}\n${JSON.stringify(body ?? null)}`)
    .digest("hex");
}

/**
 * Repeat-safe writes. On a route with `config: { idempotent: true }`, an
 * optional Idempotency-Key header makes a retry replay the first response
 * (with `Idempotent-Replayed: true`) instead of writing again. The same key
 * with a different request is 422; a duplicate while the first is still
 * running is 409. Keys are per user and kept 24 hours; expired ones are
 * deleted whenever a new key is stored. Register after requireMember.
 */
export function registerIdempotency(
  app: FastifyInstance,
  options: { db: Db },
): void {
  const { db } = options;
  app.decorateRequest("idempotencyKey", null);

  app.addHook("preHandler", async (request, reply) => {
    if (!request.routeOptions.config.idempotent) return;
    const header = request.headers["idempotency-key"];
    if (typeof header !== "string" || header === "") return;
    if (header.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
      throw new ApiError(
        400,
        "invalid_idempotency_key",
        `Idempotency-Key must be at most ${MAX_IDEMPOTENCY_KEY_LENGTH} characters.`,
      );
    }
    const userId = request.member.userId;
    const route = `${request.method} ${request.routeOptions.url}`;
    const hash = requestHash(request.method, request.url, request.body);

    await db
      .delete(idempotencyKeys)
      .where(lt(idempotencyKeys.createdAt, sql`now() - ${RETENTION}`));
    const inserted = await db
      .insert(idempotencyKeys)
      .values({ userId, key: header, route, requestHash: hash })
      .onConflictDoNothing()
      .returning({ key: idempotencyKeys.key });
    if (inserted.length > 0) {
      request.idempotencyKey = header;
      return;
    }

    const [existing] = await db
      .select()
      .from(idempotencyKeys)
      .where(
        and(
          eq(idempotencyKeys.userId, userId),
          eq(idempotencyKeys.key, header),
        ),
      );
    if (!existing || existing.requestHash !== hash) {
      return reply
        .status(422)
        .send(
          errorBody(
            "idempotency_key_reused",
            "This Idempotency-Key was already used for a different request.",
          ),
        );
    }
    if (existing.statusCode === null) {
      return reply
        .status(409)
        .send(
          errorBody(
            "request_in_progress",
            "The same request is still being processed.",
          ),
        );
    }
    return reply
      .status(existing.statusCode)
      .header("idempotent-replayed", "true")
      .send(existing.responseBody);
  });

  app.addHook("onSend", async (request, reply, payload) => {
    const key = request.idempotencyKey;
    if (!key) return payload;
    const where = and(
      eq(idempotencyKeys.userId, request.member.userId),
      eq(idempotencyKeys.key, key),
    );
    if (reply.statusCode >= 500) {
      // A failure is not stored, so the client can retry with the same key.
      await db.delete(idempotencyKeys).where(where);
      return payload;
    }
    let body: unknown = null;
    if (typeof payload === "string" && payload !== "") {
      try {
        body = JSON.parse(payload);
      } catch {
        body = payload;
      }
    }
    await db
      .update(idempotencyKeys)
      .set({ statusCode: reply.statusCode, responseBody: body })
      .where(where);
    return payload;
  });
}
