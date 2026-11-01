# Household

Every signed-in person belongs to a household, the boundary everything else
in NEXUS lives inside (ADR 0004). Code: `apps/api/src/modules/households`.

## First sign-in

The first authenticated request from someone without a membership creates a
household named "My household" with them as `admin`, in one transaction:
the household and its entity row, the membership, a `household.created`
event and a `member.added` audit entry. A per-user advisory lock makes
concurrent first requests create one household.

## Roles and visibility

- `admin` — manages the household and its settings; full access to shared
  records.
- `member` — reads and writes shared records and their own private ones.
- `guest` — reads shared records only.

Records are `shared` (whole household) or `private` (owner only).
`visibleTo(table, member)` is the query condition every domain query
composes; `assertCanWrite` and `assertRole` guard writes. Inviting others,
guests and household switching are on the roadmap (ADR 0014).

## Renaming

`PATCH /api/household` (admins) renames it; the change, its
`household.renamed` event and its audit entry commit together. The web
Settings page offers it.

## Tests

`apps/api/test/membership.test.ts`, `authorization.test.ts`,
`history.test.ts`, `me-routes.test.ts`, `idempotency.test.ts`,
`audit.test.ts`.
