import { z } from "zod";

/** Every NEXUS API error body: { error: { code, message } }. */
export const apiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});

export type ApiErrorBody = z.infer<typeof apiErrorSchema>;
