# 0014 — Sharing moves out of v0.1

Supersedes the first bullet of [0008](0008-mvp-scope.md) ("Households,
invite links, roles and authorization") in part.

## Context

ADR 0008 put invite links and roles into v0.1. The owner clarified
(2026-11-01) that NEXUS is for them alone for now: friends may look in
someday (read-only, e.g. whether there are snacks), but not yet.

## Alternatives

- **Keep invites in v0.1** — builds screens and flows nobody uses yet.
- **Drop tenancy entirely until sharing** — cheap now, but every table
  written meanwhile would need `household_id` and authorization added later.

## Decision

v0.1 keeps the tenancy groundwork: households, memberships with roles
(`admin`/`member`/`guest`), `shared`/`private` visibility helpers, and
backend authorization on every request, all covered by tests. A household is
created automatically on the first sign-in.

Moved to the roadmap ("Sharing with friends"): invite links, member
management, guest access, and switching between households.

## Consequences

- Only the owner uses NEXUS until sharing ships; sign-up stays closed
  (`SIGNUP_ALLOWED_EMAILS`).
- Sharing later adds screens and flows, not schema changes.
