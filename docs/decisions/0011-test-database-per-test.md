# 0011 — A throwaway database per integration test

Refines the test-isolation part of 0009 ("a per-run schema that is dropped
afterwards").

## Context

Integration tests share one Neon dev branch. The first approach gave each test
its own `test_*` schema via `search_path`. drizzle-kit, however, writes
schema-qualified SQL (`CREATE TYPE "public"."x"`, `REFERENCES "public"."t"`),
so once real migrations exist they would create objects in the dev database's
`public` schema — colliding between runs and mixing test and dev data.

## Decision

`createTestDatabase()` creates a whole database `test_<epochMillis>_<8 hex>`
on the same server, migrates it, and drops it `WITH (FORCE)` on cleanup.
Stale `test_*` databases older than an hour are pruned before each test run.
Both refuse to run when `NODE_ENV=production`.

## Alternatives

- Per-schema isolation with a check that rejects `"public".` in migrations —
  would reject every migration drizzle-kit generates.
- Transaction rollback per test — can't cover tests that need commits, and
  migrations would still have to run somewhere shared.

## Consequences

- Creating a database takes longer than a schema; acceptable at current suite
  size.
- The connecting role needs `CREATEDB` (true for the Neon owner role and the CI
  service user).
