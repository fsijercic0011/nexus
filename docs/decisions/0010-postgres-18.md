# 0010 — PostgreSQL 18

## Context

`neon init` created the dev project on PostgreSQL 18, Neon's default; it has no
version flag, and a project's major version cannot be changed afterwards.
Earlier planning assumed 17.

## Decision

Use **PostgreSQL 18** everywhere: Neon dev, CI service container and Railway
production. Development, CI and production always run the same major
version. Primary keys use Postgres 18's native `uuidv7()` (ADR 0005), so no
extension or application-side generator is needed for server-generated IDs.

## Consequences

- The Railway production database must be created on 18.
- An integration test asserts the connected server is version 18 or newer, so
  a mismatched database fails loudly.
