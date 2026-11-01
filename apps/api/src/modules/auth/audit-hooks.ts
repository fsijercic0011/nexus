import { APIError, createAuthMiddleware } from "better-auth/api";
import type { Db } from "../../infrastructure/db/transaction.js";
import { writeAudit } from "../households/audit.js";
import { CLIENT_ADDRESS_HEADER } from "./auth.js";

// Account-level audit (ADR 0007) for changes Better Auth performs itself.
// Better Auth runs its own writes, so these entries are written right after
// the change succeeds rather than in the same transaction.

/** Better Auth endpoint path → audit action, recorded when the call succeeds. */
const AUDITED_PATHS: Record<string, string> = {
  "/change-password": "password.changed",
  "/revoke-sessions": "sessions.revoked",
};

type HeaderSource = { headers?: Headers | undefined } | null | undefined;

function requestDetails(ctx: HeaderSource) {
  const headers = ctx?.headers;
  return {
    clientIp: headers?.get(CLIENT_ADDRESS_HEADER) ?? null,
    userAgent: headers?.get("user-agent") ?? null,
  };
}

/** The `hooks.after` middleware: audits successful sensitive endpoints. */
export function auditAfterHook(db: Db) {
  return createAuthMiddleware(async (ctx) => {
    const action = AUDITED_PATHS[ctx.path];
    if (!action) return;
    if (ctx.context.returned instanceof APIError) return;
    const userId = ctx.context.session?.user.id;
    if (!userId) return;
    await writeAudit(db, {
      actorUserId: userId,
      action,
      targetEntityType: "user",
      targetId: userId,
      ...requestDetails(ctx),
    });
  });
}

/** The `databaseHooks.user.update.after` hook: audits two-factor turning on
 * (first verified code) and off. */
export function auditTwoFactorChange(db: Db) {
  return async (
    user: { id: string; twoFactorEnabled?: unknown },
    ctx: ({ path?: string } & HeaderSource) | null,
  ) => {
    let action: string | null = null;
    if (ctx?.path === "/two-factor/verify-totp" && user.twoFactorEnabled) {
      action = "2fa.enabled";
    } else if (ctx?.path === "/two-factor/disable") {
      action = "2fa.disabled";
    }
    if (!action) return;
    await writeAudit(db, {
      actorUserId: user.id,
      action,
      targetEntityType: "user",
      targetId: user.id,
      ...requestDetails(ctx),
    });
  };
}
