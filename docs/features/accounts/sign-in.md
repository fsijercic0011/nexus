# Sign-in

How the owner gets into NEXUS. Code: `apps/api/src/modules/auth`.

## Who can create an account

Sign-up is closed. Only emails listed in `SIGNUP_ALLOWED_EMAILS` (comma
separated, case-insensitive) can create an account, by any method. The check
runs in Better Auth's user-creation hook, which every sign-up path passes
through. Any other email gets a 403 with "This account can't be created." and
no account is stored. Emails are stored lower-cased; an email with
surrounding spaces is rejected as invalid (the web form trims it first).
Removing an email from the list later does not lock out an existing account.

## Methods

- **Email and password** — `POST /api/auth/sign-up/email`,
  `POST /api/auth/sign-in/email`.
- **Google** — only when `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set
  ([integration](../../integrations/google-oauth.md)). `GET
  /api/auth-providers` returns `{ "google": true | false }` so the sign-in
  page knows whether to show the button. Google links to an existing account
  with the same email.

## Two-factor (TOTP)

Optional, per user, using Better Auth's two-factor plugin (issuer "NEXUS").

- **Enable:** `POST /api/auth/two-factor/enable` with the password returns an
  `otpauth://` URI (shown as a QR code) and 10 backup codes; it takes effect
  once `POST /api/auth/two-factor/verify-totp` confirms a code from the app.
- **Sign-in:** a password sign-in of a user with 2FA returns
  `{ "twoFactorRedirect": true }` and no session; the session starts after
  `verify-totp` or `verify-backup-code`. Each backup code works once.
- **Disable:** `POST /api/auth/two-factor/disable` with the password.
- **Google sign-ins aren't challenged**; the Google account's own 2-step
  verification applies ([ADR 0013](../../decisions/0013-two-factor-for-password-sign-in-only.md)).

Sessions are Better Auth cookie sessions: `HttpOnly`, `SameSite=Lax`, and
`Secure` in production.

## Rate limiting and client address

Better Auth rate-limits its endpoints per client address (for example a few
password attempts per 10 seconds). The address comes from the API, never from
the client: the auth route strips any incoming `x-nexus-client-address` header
and sets it to the request's address. On Railway (`RAILWAY_ENVIRONMENT_ID` or
`RAILWAY_ENVIRONMENT` set) that is the edge's `X-Real-IP`; elsewhere
`X-Real-IP` is ignored so a client can't pose as another address
(`apps/api/src/infrastructure/client-address.ts`).

## Tests

`apps/api/test/auth.test.ts`, `google.test.ts` and `two-factor.test.ts` (real database), `allowlist.test.ts`,
`client-address.test.ts`, `config.test.ts`.
