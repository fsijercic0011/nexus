# Data model

Postgres 18 via Drizzle. Schema: `apps/api/src/infrastructure/db/schema/`;
migrations: `apps/api/src/infrastructure/db/migrations/` (generated,
append-only, applied with `pnpm db:migrate`). Ids are UUIDv7 (`uuidv7()` in
the database, the `uuidv7` package in code); timestamps are `timestamptz`
(UTC).

## Accounts (Better Auth)

| Table | Holds |
| --- | --- |
| `users` | One row per person: `name`, `email` (unique, lower-case), `email_verified`, `image`, `two_factor_enabled`. |
| `sessions` | Signed-in sessions: `token`, `expires_at`, `ip_address`, `user_agent`, `user_id`. |
| `accounts` | Sign-in methods per user: `provider_id` (`credential` for password, `google`), `account_id`, password hash or OAuth tokens. |
| `verifications` | Short-lived values Better Auth checks (OAuth state, two-factor challenges). |
| `two_factors` | TOTP secret and backup codes per user (encrypted by Better Auth), lockout counters. |

## Tenancy (ADR 0004)

| Table | Holds |
| --- | --- |
| `households` | The tenancy boundary: `name`. Its `id` is also its row in `entities` (deferred foreign key). |
| `household_members` | `household_id`, `user_id`, `role` (`member_role`: `admin`, `member`, `guest`); unique per household and user. A person may belong to several households; the oldest membership is the active one until switching exists. |
| `properties` | Places a household manages (`name`). Schema only; the UI assumes one. Its `id` is also its row in `entities`. |

Domain tables with private records spread `ownedRecordColumns()`:
`visibility` (`shared` default, or `private`) and `owner_member_id`.

## Entities and history (ADR 0005)

| Table | Holds |
| --- | --- |
| `entities` | The registry: `id`, `household_id`, `entity_type`, `created_at`, `archived_at`. Domain rows use their entity's id as their own primary key, so events, attachments and QR codes can point at anything. |
| `events` | One row per state change: `entity_id`, `event_type`, `actor_user_id`, `source` (`user`, `system`, `integration:<name>`), `occurred_at`, `recorded_at`, validated `payload`, `correlation_id`, `idempotency_key` (unique per household when set). Written in the same transaction as the change; kept permanently. |

Event types and their payload schemas live in
`packages/shared/src/events.ts`; today `household.created` (`{ name }`) and
`household.renamed` (`{ from, to }`).

## Audit (ADR 0007)

`audit_logs`: `household_id` (null for account-level changes),
`actor_user_id`, `action`, `target_entity_type`, `target_id`, `before`,
`after`, `client_ip`, `user_agent`, `occurred_at`.

Actions recorded: `member.added`, `household.renamed`, `profile.renamed`,
`password.changed`, `password.reset_by_cli`, `2fa.enabled`, `2fa.disabled`,
`sessions.revoked`. NEXUS's own changes write their audit entry in the same
transaction; changes Better Auth performs (password, two-factor, sessions)
are audited right after they succeed.

## Idempotency

`idempotency_keys`: `user_id` + `key` (primary key), `route`,
`request_hash`, `status_code` (null while in progress), `response_body`,
`created_at`. Rows older than 24 hours are deleted whenever a new key is
stored. See [API](api.md#idempotency).
