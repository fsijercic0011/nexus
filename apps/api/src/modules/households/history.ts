import {
  type EventPayload,
  type EventType,
  eventPayloadSchemas,
} from "@nexus/shared";
import { entities, events } from "../../infrastructure/db/schema/index.js";
import type { Tx } from "../../infrastructure/db/transaction.js";

/** Adds a row to the entity registry and returns its id. Call inside the
 * transaction that inserts the domain row with the same id. */
export async function createEntity(
  tx: Tx,
  input: { householdId: string; entityType: string; id?: string },
): Promise<string> {
  const [row] = await tx
    .insert(entities)
    .values({
      ...(input.id ? { id: input.id } : {}),
      householdId: input.householdId,
      entityType: input.entityType,
    })
    .returning({ id: entities.id });
  if (!row) throw new Error("Entity insert returned no row");
  return row.id;
}

export type RecordEventInput<T extends EventType> = {
  householdId: string;
  entityId: string;
  eventType: T;
  actorUserId: string | null;
  payload: EventPayload<T>;
  source?: string;
  occurredAt?: Date;
  correlationId?: string;
  idempotencyKey?: string;
};

/** Records a domain event. Call inside the transaction that changes the
 * state it describes (ADR 0005). The payload is validated against the
 * event type's schema; an unknown type or invalid payload throws, which
 * rolls the whole transaction back. */
export async function recordEvent<T extends EventType>(
  tx: Tx,
  input: RecordEventInput<T>,
): Promise<void> {
  const schema = eventPayloadSchemas[input.eventType];
  if (!schema) throw new Error(`Unknown event type: ${input.eventType}`);
  const payload = schema.parse(input.payload);
  await tx.insert(events).values({
    householdId: input.householdId,
    entityId: input.entityId,
    eventType: input.eventType,
    actorUserId: input.actorUserId,
    source: input.source ?? "user",
    occurredAt: input.occurredAt ?? new Date(),
    payload,
    correlationId: input.correlationId,
    idempotencyKey: input.idempotencyKey,
  });
}
