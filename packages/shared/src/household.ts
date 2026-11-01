import { z } from "zod";

/** A display name (person or household): trimmed, 1–100 characters. */
export const nameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name.")
  .max(100, "Use at most 100 characters.");

export const memberRoleSchema = z.enum(["admin", "member", "guest"]);
export type MemberRole = z.infer<typeof memberRoleSchema>;

export const renameRequestSchema = z.object({ name: nameSchema });
export type RenameRequest = z.infer<typeof renameRequestSchema>;
