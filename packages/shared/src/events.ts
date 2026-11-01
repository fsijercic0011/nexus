import { z } from "zod";

/** The payload schema of every domain event type. An event type without an
 * entry here can't be recorded. */
export const eventPayloadSchemas = {
  "household.created": z.object({ name: z.string() }),
  "household.renamed": z.object({ from: z.string(), to: z.string() }),
} satisfies Record<string, z.ZodType>;

export type EventType = keyof typeof eventPayloadSchemas;
export type EventPayload<T extends EventType> = z.infer<
  (typeof eventPayloadSchemas)[T]
>;
