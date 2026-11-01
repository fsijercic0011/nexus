# Settings

`/settings` (`apps/web/src/features/settings`): the signed-in person's
account, its security, and the household. Each section is its own region.

- **Profile** — the display name (1–100 characters, trimmed), saved with
  `PATCH /api/me/profile`. The email is shown but can't be changed yet:
  changing it needs a verification email, and NEXUS has no email delivery.
- **Password** — change it with the current password (new one at least 8
  characters). Forgotten passwords are reset with the server command
  ([guide](../../guides/reset-a-password.md)).
- **Two-factor authentication** — On/Off badge. **Turn on** asks for the
  password, shows a QR code and the key as text for the authenticator app,
  asks for a code, then shows the backup codes once; the dialog closes only
  through "I've saved these". **Turn off** asks for the password. Applies to
  password sign-in only (ADR 0013).
- **Sessions** — **Sign out** (this device) and **Sign out everywhere**
  (every device, after a confirmation). Both end on the sign-in page.
- **Household** — rename it (admins); other roles see it read-only.
- **About** — whether the API and database are reachable.

Name saves send a fresh `Idempotency-Key` per attempt, so a double-click or
a retried request never writes twice. Leaving with unsaved name changes asks
to save or discard.

## Tests

`apps/web/src/features/settings/SettingsPage.test.tsx`; the full flow
(create account → rename household → turn on two-factor → sign out → sign in
with the code) is `apps/web/e2e/accounts.spec.ts`, on desktop and phone.
