import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { twoFactor } from "better-auth/plugins";
import { uuidv7 } from "uuidv7";
import type { AppConfig } from "../../infrastructure/config.js";
import type { Database } from "../../infrastructure/db/client.js";
import * as schema from "../../infrastructure/db/schema/index.js";
import { isSignupAllowed, normalizeEmail } from "./allowlist.js";
import { auditAfterHook, auditTwoFactorChange } from "./audit-hooks.js";

/** The request header the auth route sets to the client's address (and
 * strips from incoming requests), so Better Auth rate-limits by the real
 * address and never by a header a client chose. */
export const CLIENT_ADDRESS_HEADER = "x-nexus-client-address";

export const SIGNUP_REFUSED_MESSAGE = "This account can't be created.";

export function createAuth(database: Database, config: AppConfig) {
  return betterAuth({
    appName: "NEXUS",
    basePath: "/api/auth",
    baseURL: config.authUrl,
    secret: config.authSecret,
    database: drizzleAdapter(database.db, {
      provider: "pg",
      schema,
      usePlural: true,
    }),
    emailAndPassword: { enabled: true },
    socialProviders: config.google
      ? {
          google: {
            clientId: config.google.clientId,
            clientSecret: config.google.clientSecret,
          },
        }
      : {},
    account: {
      // Google signs in to the owner's existing password account (same
      // email) instead of failing as a duplicate.
      accountLinking: { enabled: true, trustedProviders: ["google"] },
    },
    // TOTP for password sign-in. Google sign-ins aren't challenged; the
    // Google account's own 2-step verification applies (ADR 0013).
    plugins: [twoFactor({ issuer: "NEXUS" })],
    rateLimit: { enabled: config.authRateLimit },
    advanced: {
      database: { generateId: () => uuidv7() },
      ipAddress: { ipAddressHeaders: [CLIENT_ADDRESS_HEADER] },
      useSecureCookies: config.nodeEnv === "production",
    },
    hooks: { after: auditAfterHook(database.db) },
    databaseHooks: {
      user: {
        update: { after: auditTwoFactorChange(database.db) },
        create: {
          // Every way of creating an account (password, Google) passes
          // through here, so the allowlist can't be bypassed.
          async before(user) {
            if (!isSignupAllowed(user.email, config.signupAllowedEmails)) {
              throw new APIError("FORBIDDEN", {
                message: SIGNUP_REFUSED_MESSAGE,
              });
            }
            return { data: { ...user, email: normalizeEmail(user.email) } };
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
