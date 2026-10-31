# 0009 — Hosted development database instead of Docker

Supersedes the local-development part of 0001 (Docker Compose with Postgres and
MinIO) and the "MinIO locally" note in 0003.

## Context

Docker Desktop on Windows needs WSL2, several GB of disk and RAM, and must be
running whenever the database is needed. For a single developer early in the
project that is more setup than it is worth.

## Decision

- **No Docker for local development.** The API and web app run directly on the
  machine (`pnpm dev`) and connect to a **hosted development/test Postgres**
  via `DATABASE_URL` in `.env`. It is a separate database from production and
  never shares data with it. The provider is **Neon** (free tier); production
  stays on Railway. Migrations use Neon's direct connection string, not the
  pooled one.
- **Tests must not depend on leftover state.** Integration tests run each test
  in a transaction that is rolled back, or in a per-run schema that is dropped
  afterwards, so a shared remote database stays clean.
- **CI** uses a Postgres service container on GitHub Actions — no local Docker
  involved.
- **File storage in development** is decided when file uploads are first
  built (a separate dev R2 bucket or a local-disk adapter).
- **pnpm** is installed with `npm install -g pnpm` (user folder, no admin
  rights) instead of `corepack enable`; the repo still pins the version via
  `packageManager` in `package.json`.

## Consequences

- Local development and tests need an internet connection.
- Integration tests are slower than against a local database.
- The dev database credentials live only in `.env`.
