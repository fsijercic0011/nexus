# 0004 — Tenancy, roles and visibility

## Context

The household is the tenancy boundary (spec §3.1). Open questions in spec §17
covered multiple properties, multiple households per person, private vs shared
records, roles and guest access.

## Decision

- **Every household-owned row carries `household_id`.** Authorization is
  enforced in the backend on every request and covered by tenancy tests.
  Postgres Row-Level Security is deferred as later defense in depth.
- **A person can belong to several households** (`users` ↔ `households` via
  `household_members`).
- **A household can have several properties** in the schema (`properties`);
  the MVP UI assumes one.
- **Roles:** `admin`, `member`, `guest`.
  - `admin` — manages the household, its settings and its members; full access
    to shared records. The creator becomes admin; the last admin cannot leave or
    be demoted.
  - `member` — reads and writes shared records and their own private records.
  - `guest` — read-only access to shared records; no private records. The role
    exists in the schema from the start; guest invitations and time-limited
    access come later.
- **Visibility:** each record is `shared` (whole household) or `private`
  (owner only). Selective sharing is not supported in the MVP.

## Consequences

- Every query helper must take the household and the acting member; a missing
  scope is a bug.
- Adding selective sharing later means adding a grants table, not changing the
  `shared`/`private` default.
