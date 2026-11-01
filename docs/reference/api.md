# API

Everything is under `/api`, served by `apps/api`. Request and response
schemas shared with the web app live in `packages/shared`.

## Errors

Every NEXUS error is

```json
{ "error": { "code": "validation_failed", "message": "Enter a name." } }
```

| Status | `code` | When |
| --- | --- | --- |
| 400 | `validation_failed` | The body failed its schema; `message` is the first problem, readable as is. |
| 400 | `invalid_idempotency_key` | `Idempotency-Key` longer than 128 characters. |
| 401 | `unauthenticated` | No valid session. |
| 403 | `forbidden` | The member's role or the record's visibility doesn't allow it. |
| 409 | `request_in_progress` | The same idempotent request is still running. |
| 422 | `idempotency_key_reused` | The key was used for a different request. |
| 500 | `internal` | Anything unexpected (details only in the server log). |

Better Auth's own endpoints (`/api/auth/*`) keep Better Auth's error shape
(`{ "message", "code" }`).

## Authentication

- `/api/auth/*` — Better Auth: sign-up, sign-in, sign-out, sessions,
  password change, two-factor, Google. See
  [sign-in](../features/accounts/sign-in.md).
- `GET /api/auth-providers` — public; `{ "google": boolean }`.
- `GET /api/health` — public; API and database status.

Every other route requires a signed-in household member. The API resolves
the session to the member (user, household, role) on each request, creating
the household on first use.

## Account and household

| Method and path | Body | Response | Notes |
| --- | --- | --- | --- |
| `GET /api/me` | — | `{ user: { id, name, email, twoFactorEnabled }, household: { id, name }, role }` | `meSchema`. |
| `PATCH /api/me/profile` | `{ name }` | `{ name }` | Idempotent. Audited. |
| `PATCH /api/household` | `{ name }` | `{ name }` | Admin only. Idempotent. Records `household.renamed` and an audit entry. |

Names are trimmed and must be 1–100 characters (`nameSchema`); any script
and emoji are fine.

## Idempotency

Write endpoints accept an optional `Idempotency-Key` header (at most 128
characters, unique per user — the web app sends a UUIDv7 per save attempt
and reuses it on retry):

- First request: runs normally; its status and body are stored for 24 hours.
- Same key, same request: the stored response is returned with
  `Idempotent-Replayed: true`; nothing is written again.
- Same key, different request: 422 `idempotency_key_reused`.
- Same key while the first is still running: 409 `request_in_progress`.
- A 5xx response is not stored, so the client can retry with the same key.
