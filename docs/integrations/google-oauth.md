# Google OAuth

**Used for:** "Continue with Google" on the sign-in page.

- **Scopes:** `openid`, `email`, `profile` — NEXUS reads only the email,
  name and picture URL to create or match the account. No other Google data
  is requested or stored besides the OAuth tokens Better Auth keeps in
  `accounts`.
- **Configuration:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (both or
  neither). Setup: [guide](../guides/google-oauth-setup.md).
- **Callback:** `<BETTER_AUTH_URL>/api/auth/callback/google`.
- **Allowlist:** a Google sign-up goes through the same allowlist hook as a
  password sign-up.
- **Account linking:** Google links to an existing account with the same
  email (`trustedProviders: ["google"]`).
- **Two-factor:** Google sign-ins aren't challenged for NEXUS's TOTP; the
  Google account's own 2-step verification applies (ADR 0013).
- **Cost:** free.
- **Code:** `apps/api/src/modules/auth/auth.ts`,
  `apps/api/src/modules/auth/providers.ts` (`GET /api/auth-providers`).
