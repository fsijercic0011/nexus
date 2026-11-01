# Local development

The apps run directly on your machine against a hosted Neon dev database
(ADR 0009). There is no Docker.

## Prerequisites

- Node 24 (`.nvmrc`) and pnpm 12 (`npm install -g pnpm`).
- The Neon CLI (`npm i -g neon`), signed in with `neon login`.
- The repo linked to the Neon project: `neon init` writes `.neon` and
  `.env.local` (both gitignored). `.env.local` holds `DATABASE_URL` (pooled,
  used by the app) and `DATABASE_URL_UNPOOLED` (direct, used by migrations and
  tests). See `.env.example` for every variable.

## Sign-in settings

Add these to `.env.local` (all listed in `.env.example`):

- `BETTER_AUTH_SECRET` — signs sessions; at least 32 characters. Generate
  one with `openssl rand -base64 32`.
- `BETTER_AUTH_URL=http://localhost:5173` — the address you open NEXUS on.
  Required in production.
- `SIGNUP_ALLOWED_EMAILS` — comma-separated emails that may create an
  account. Leave it blank and nobody can sign up.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — optional; both or neither.
  See [Google OAuth setup](google-oauth-setup.md).

## First run

```sh
pnpm install
pnpm db:migrate
pnpm dev
```

`pnpm dev` starts the API on `http://127.0.0.1:3000` and the web dev server on
`http://localhost:5173`, which proxies `/api` to the API. Both reload on
change.

## Tests

`pnpm test` runs every package's tests. Integration tests in `apps/api` need
`DATABASE_URL_UNPOOLED`; without it they are skipped with a warning.

Each test that needs a database calls `createTestDatabase()`
(`apps/api/test/test-database.ts`). It creates a throwaway **database** named
`test_<timestamp>_<random>` on the same Neon branch, runs all migrations into
it, and drops it afterwards. A whole database rather than a schema, because
drizzle-kit writes `"public".`-qualified SQL that would escape a schema. Tests
never touch the dev database's own data. Test databases left behind by a
crashed run are dropped automatically at the start of the next run once they
are more than an hour old (ADR 0011).

## End-to-end tests

`pnpm e2e` runs the Playwright tests in `apps/web/e2e` against the **built**
app, on a desktop and a phone (Pixel 7) viewport. Run `pnpm build` first.
Install the browser once with
`pnpm --filter @nexus/web exec playwright install chromium`.

The global setup (`apps/web/e2e/global-setup.ts`) creates its own throwaway
`test_*` database (`apps/api/test/e2e-database.ts`), starts the compiled API
on port 3100 against it with fixed e2e-only auth settings (allowlist
`owner+desktop@nexus.test`, `owner+mobile@nexus.test`; `AUTH_RATE_LIMIT=off`,
which the API refuses in production), and drops the database afterwards. It
needs `DATABASE_URL_UNPOOLED` and never touches the dev database's data.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and on pushes to
`main`: install, lint, typecheck, build, migrate, test and e2e, against a
Postgres 18 service container instead of Neon. To reproduce it locally:

```sh
pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm build && pnpm db:migrate && pnpm test && pnpm e2e
```

pnpm runs dependency install scripts only for packages listed under
`allowBuilds` in `pnpm-workspace.yaml` (currently `esbuild`). A new
dependency that needs one fails `pnpm install --frozen-lockfile` until it is
approved with `pnpm approve-builds <package>`.

## Migrations

- Change the Drizzle schema in `apps/api/src/infrastructure/db/schema/`, then
  `pnpm db:generate` and review the generated SQL before committing.
- `pnpm db:migrate` applies pending migrations using `DATABASE_URL_UNPOOLED`.
  Migrations never run at server startup.

## Resetting the dev database

Reset the Neon branch to an empty state with `neon branches reset`, or drop
individual schemas. Then run `pnpm db:migrate` again.
