# Changelog

## 2026-11-01

- Ported the shared UI primitives from Imperior with the Graphite dark theme
  (ADR 0012).
- Ported the composite components (dialogs, forms, tables, filters, page
  header with ⓘ) and documented the design system.
- Added the app shell: sidebar on desktop, bottom tab bar on phones, Home
  and Settings pages; e2e runs on desktop and phone viewports.
- Added email + password sign-in with Better Auth; only emails in
  `SIGNUP_ALLOWED_EMAILS` can create an account; rate limiting uses the real
  client address (Railway's `X-Real-IP` only on Railway).
- Added optional Google sign-in (shown only when configured) and a Google
  OAuth setup guide.
- Added optional TOTP two-factor with backup codes for password sign-in
  (ADR 0013).
- Added households (created on first sign-in), role and visibility checks,
  the entity registry with event history, the audit log, and repeat-safe
  writes via `Idempotency-Key`; `GET /api/me`, `PATCH /api/me/profile`,
  `PATCH /api/household`. Sharing moved out of v0.1 (ADR 0014).
- Added `pnpm --filter @nexus/api reset-password <email>` for forgotten
  passwords until email delivery exists.
- Added the sign-in page (sign in, create account, Google when configured,
  two-factor step) and the session guard around the app shell.
- Added the Settings page (profile, password, two-factor setup with QR code
  and backup codes, sign out / sign out everywhere, household name); e2e now
  runs the signed-in flow on its own throwaway database.
- Fixed: sessions are now extended while in use (the refreshed cookie
  reaches the browser); Google sign-in failures show a message; OAuth codes
  no longer appear in request logs; Google is documented as not linking to
  password accounts.

## 2026-10-31

- Recorded project setup decisions (ADRs 0001–0008), the roadmap, and the
  project `CLAUDE.md`.
- Dropped Docker for local development in favor of a hosted dev database
  (ADR 0009).
- Linked the Neon dev project; standardized on PostgreSQL 18 (ADR 0010).
- Scaffolded the pnpm monorepo: shared health contract, Fastify API with
  `GET /api/health`, Drizzle migrations and isolated test schemas on Neon.
- Added the React web app (health status), SPA serving from the API, a
  Playwright smoke test and GitHub Actions CI.
- Integration tests use a throwaway database per test (ADR 0011); malformed
  database URLs and a missing web build now fail startup with a named variable.
