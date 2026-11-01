import type { MemberRole } from "@nexus/shared";
import { and, eq, or, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

/** Who is acting, in which household, with which role. Every household-
 * scoped query and write takes one (ADR 0004). */
export type MemberContext = {
  userId: string;
  memberId: string;
  householdId: string;
  role: MemberRole;
};

export class ForbiddenError extends Error {
  readonly statusCode = 403;
  readonly code = "forbidden";
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

type OwnedTable = {
  householdId: PgColumn;
  visibility: PgColumn;
  ownerMemberId: PgColumn;
};

/** The rows of `table` the member may see: their household's shared rows,
 * plus their own private rows unless they are a guest. */
export function visibleTo(table: OwnedTable, member: MemberContext): SQL {
  const inHousehold = eq(table.householdId, member.householdId);
  const shared = eq(table.visibility, "shared");
  if (member.role === "guest") return and(inHousehold, shared) as SQL;
  return and(
    inHousehold,
    or(shared, eq(table.ownerMemberId, member.memberId)),
  ) as SQL;
}

/** Throws unless the member may change this record. */
export function assertCanWrite(
  member: MemberContext,
  record: {
    householdId: string;
    visibility: "shared" | "private";
    ownerMemberId: string | null;
  },
): void {
  if (member.role === "guest") throw new ForbiddenError();
  if (record.householdId !== member.householdId) throw new ForbiddenError();
  if (
    record.visibility === "private" &&
    record.ownerMemberId !== member.memberId
  ) {
    throw new ForbiddenError();
  }
}

/** Throws unless the member holds one of `roles`. */
export function assertRole(member: MemberContext, ...roles: MemberRole[]) {
  if (!roles.includes(member.role)) throw new ForbiddenError();
}
