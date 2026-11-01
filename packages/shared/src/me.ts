import { z } from "zod";

/** GET /api/auth-providers: which sign-in methods besides password exist. */
export const authProvidersSchema = z.object({ google: z.boolean() });

export type AuthProviders = z.infer<typeof authProvidersSchema>;
