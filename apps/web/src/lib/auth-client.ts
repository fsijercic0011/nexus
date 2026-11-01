import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** Better Auth's client for /api/auth/* (sign-in, sign-up, two-factor,
 * sessions). NEXUS's own endpoints go through lib/api.ts. */
export const authClient = createAuthClient({
  baseURL: typeof window === "undefined" ? undefined : window.location.origin,
  basePath: "/api/auth",
  plugins: [twoFactorClient()],
});
