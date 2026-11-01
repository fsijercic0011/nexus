# 0013 — Two-factor applies to password sign-in

Refines [0007](0007-security-baseline.md) ("TOTP two-factor authentication
is available to every user from the first auth release").

## Context

NEXUS signs in with email + password or with Google. Better Auth's
two-factor plugin challenges password sign-ins only; a Google sign-in creates
a session directly. Google is likely to be the owner's everyday sign-in.

## Alternatives

- **A NEXUS code after Google too** — a custom gate: sessions start
  "unverified" until a code is entered, and middleware refuses everything but
  the 2FA endpoints until then. It touches the session model and every
  request, for protection Google's own 2-step verification already gives.
- **Disable password sign-in once Google is linked** — loses the fallback
  when Google is unavailable.

## Decision

The owner chose (2026-11-01): TOTP is available to every user, set up in
Settings, and required at password sign-in when enabled. Google sign-ins are
not challenged by NEXUS; they rely on the Google account's 2-step
verification.

## Consequences

- The owner should keep 2-step verification on for their Google account.
- If sharing brings in users whose Google accounts NEXUS can't vouch for,
  revisit with the gate above.
