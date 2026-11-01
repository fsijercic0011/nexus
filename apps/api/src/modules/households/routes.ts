import { type Me, renameRequestSchema } from "@nexus/shared";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { households, users } from "../../infrastructure/db/schema/index.js";
import {
  type Db,
  withTransaction,
} from "../../infrastructure/db/transaction.js";
import { writeAudit } from "./audit.js";
import { assertRole } from "./authorization.js";
import { recordEvent } from "./history.js";

/** /api/me, /api/me/profile and /api/household. Registered inside a
 * requireMember scope, so request.member is always set. */
export async function householdRoutes(
  app: FastifyInstance,
  options: { db: Db },
): Promise<void> {
  const { db } = options;

  app.get("/me", async (request): Promise<Me> => {
    const { member } = request;
    const [row] = await db
      .select({
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          twoFactorEnabled: users.twoFactorEnabled,
        },
        household: { id: households.id, name: households.name },
      })
      .from(users)
      .innerJoin(households, eq(households.id, member.householdId))
      .where(eq(users.id, member.userId));
    if (!row) throw new Error("Signed-in user or household missing");
    return {
      user: { ...row.user, twoFactorEnabled: !!row.user.twoFactorEnabled },
      household: row.household,
      role: member.role,
    };
  });

  app.patch(
    "/me/profile",
    { config: { idempotent: true } },
    async (request) => {
      const { name } = renameRequestSchema.parse(request.body);
      const { member } = request;
      await withTransaction(db, async (tx) => {
        const [before] = await tx
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, member.userId));
        await tx.update(users).set({ name }).where(eq(users.id, member.userId));
        await writeAudit(tx, {
          actorUserId: member.userId,
          action: "profile.renamed",
          targetEntityType: "user",
          targetId: member.userId,
          before: { name: before?.name },
          after: { name },
          clientIp: request.clientAddress,
          userAgent: request.headers["user-agent"] ?? null,
        });
      });
      return { name };
    },
  );

  app.patch("/household", { config: { idempotent: true } }, async (request) => {
    const { member } = request;
    assertRole(member, "admin");
    const { name } = renameRequestSchema.parse(request.body);
    await withTransaction(db, async (tx) => {
      const [before] = await tx
        .select({ name: households.name })
        .from(households)
        .where(eq(households.id, member.householdId))
        .for("update");
      const from = before?.name ?? "";
      await tx
        .update(households)
        .set({ name })
        .where(eq(households.id, member.householdId));
      await recordEvent(tx, {
        householdId: member.householdId,
        entityId: member.householdId,
        eventType: "household.renamed",
        actorUserId: member.userId,
        payload: { from, to: name },
        idempotencyKey: request.idempotencyKey ?? undefined,
      });
      await writeAudit(tx, {
        householdId: member.householdId,
        actorUserId: member.userId,
        action: "household.renamed",
        targetEntityType: "household",
        targetId: member.householdId,
        before: { name: from },
        after: { name },
        clientIp: request.clientAddress,
        userAgent: request.headers["user-agent"] ?? null,
      });
    });
    return { name };
  });
}
