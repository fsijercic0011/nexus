import type { AuthProviders } from "@nexus/shared";
import type { FastifyInstance } from "fastify";

/** GET /api/auth-providers: public; tells the sign-in page whether to offer
 * Google. */
export async function authProviderRoutes(
  app: FastifyInstance,
  options: { google: boolean },
): Promise<void> {
  app.get(
    "/auth-providers",
    async (): Promise<AuthProviders> => ({
      google: options.google,
    }),
  );
}
