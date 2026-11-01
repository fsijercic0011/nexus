import { z } from "zod";

/** GET /api/auth-providers: which sign-in methods besides password exist. */
export const authProvidersSchema = z.object({ google: z.boolean() });

export type AuthProviders = z.infer<typeof authProvidersSchema>;

/** GET /api/me: the signed-in person, their household and role. */
export const meSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    twoFactorEnabled: z.boolean(),
  }),
  household: z.object({ id: z.string(), name: z.string() }),
  role: z.enum(["admin", "member", "guest"]),
});

export type Me = z.infer<typeof meSchema>;
