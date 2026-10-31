# Monorepo Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A runnable, tested, CI-checked NEXUS monorepo skeleton — web app, API, shared package, database tooling — with one end-to-end slice (`GET /api/health` shown in the web app) and no domain features.

**Architecture:** pnpm workspaces with `apps/api` (Fastify, serves the built SPA in production), `apps/web` (React + Vite PWA) and `packages/shared` (Zod contracts). Drizzle talks to Neon Postgres 18 in development and a Postgres 18 service container in CI; integration tests isolate themselves in throwaway schemas.

**Tech Stack:** Node 24, pnpm 12, TypeScript (ESM), Fastify 5, `@fastify/static`, Drizzle ORM + Drizzle Kit, postgres.js (`postgres`), Zod, React 19, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), TanStack Query 5, `vite-plugin-pwa`, Vitest, Testing Library, Playwright, Biome, tsx, GitHub Actions. Install the latest stable version of each; the lockfile pins them.

**Spec:** `CLAUDE.md` and ADRs `docs/decisions/0001`–`0010` (the scaffold has no product spec; the product spec `docs/NEXUS_Product_Architecture_and_Initial_Specification.md` §11–§12 sets the shape).

**Out of scope (separate plans):** authentication (Better Auth), the data model and first real tables, design system and app shell (bottom tab bar / sidebar, ⓘ info button), PWA icons (no branding yet), Railway deployment, realtime, background jobs.

## Global Constraints

- Node `>=24` (`.nvmrc`: `24`); `"packageManager": "pnpm@12.16.1"` in root `package.json`.
- Package names: `@nexus/api`, `@nexus/web`, `@nexus/shared`. All `"type": "module"`, all `"private": true`.
- Line endings LF everywhere (`.gitattributes`: `* text=auto eol=lf`; Biome `lineEnding: "lf"`).
- Env comes from repo-root `.env.local` (written by `neon init`): `DATABASE_URL` (pooled, app), `DATABASE_URL_UNPOOLED` (direct, migrations and tests). Never log, print or commit their values. `.env.example` lists every variable with a blank value.
- Migrations: Drizzle Kit generated, append-only, applied only by `pnpm db:migrate` — never at startup.
- Postgres 18 in every environment (ADR 0010).
- API listens on port `3000`, web dev server on `5173`; all API routes are under `/api`.
- English-only UI text; colors only via theme tokens.
- Commit after each task (on branch `chore/monorepo-scaffold`); never push unless the user asks.

## Review Focus

1. **Secrets in error output** — a missing or malformed env var must produce an error that names the variable but never contains any env value. Test in Task 3.
2. **Database unreachable or hanging** — `/api/health` must answer within ~2 s with `503` and `database: "unavailable"`, not hang or crash. Test in Task 3.
3. **Crashed test runs** — leftover `test_*` schemas from aborted runs must be pruned automatically so the shared Neon database doesn't fill up. Test in Task 4.
4. **SPA fallback over-reach** — a missing asset (`/assets/missing.js`) must return `404`, not `index.html`; an unknown `/api/*` route must return a JSON `404`. Test in Task 6.
5. **Tests touching real data** — the test DB helper must refuse to run when `NODE_ENV=production` and must only ever create/drop its own `test_*` schema. Test in Task 4.

---

## File Structure

```
.gitattributes  .nvmrc  .env.example  biome.json  package.json
pnpm-workspace.yaml  tsconfig.base.json
.github/workflows/ci.yml
packages/shared/
  package.json  tsconfig.json
  src/index.ts                 re-exports
  src/health.ts                health contract (Zod)
  src/health.test.ts
apps/api/
  package.json  tsconfig.json  drizzle.config.ts  vitest.config.ts
  src/server.ts                process entry: env file, config, db, listen
  src/app.ts                   buildApp() — Fastify instance, no I/O at import
  src/infrastructure/env-file.ts   loadEnvFileIfPresent()
  src/infrastructure/config.ts     loadConfig(), ConfigError
  src/infrastructure/db/client.ts  createDatabase(), checkDatabase()
  src/infrastructure/db/schema/index.ts   (empty barrel; tables come later)
  src/infrastructure/db/migrate.ts        CLI for pnpm db:migrate
  src/infrastructure/db/migrations/       Drizzle Kit output
  src/infrastructure/web-app.ts    registerWebApp() — static SPA + fallback
  src/modules/health/routes.ts     GET /api/health
  test/test-database.ts            createTestDatabase(), pruneStaleTestSchemas()
  test/*.test.ts
apps/web/
  package.json  tsconfig.json  vite.config.ts  index.html  playwright.config.ts
  src/main.tsx  src/App.tsx
  src/styles/theme.css            Tailwind import + @theme tokens
  src/features/health/HealthStatus.tsx (+ .test.tsx)
  src/lib/api.ts                  getJson()
  e2e/smoke.spec.ts
docs/guides/local-development.md
```

`packages/shared` exports conditionally so dev tools read TypeScript source and production reads compiled output:
`"exports": { ".": { "types": "./src/index.ts", "development": "./src/index.ts", "default": "./dist/index.js" } }`. The API's `dev` script runs `tsx watch --conditions=development`; Vite and Vitest resolve `development` in dev/test by default.

---

### Task 1: Workspace root and tooling

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml` (`apps/*`, `packages/*`), `.nvmrc`, `.gitattributes`, `biome.json`, `tsconfig.base.json`, `.env.example`
- Modify: `CLAUDE.md` (Working conventions → add the command list)

**Interfaces:**
- Produces: root scripts used by every later task and by CI —
  `dev` (`pnpm --parallel --filter @nexus/api --filter @nexus/web dev`), `build` (`pnpm -r build`), `test` (`pnpm -r test`), `typecheck` (`pnpm -r typecheck`), `lint` (`biome check .`), `format` (`biome check --write .`), `db:generate` / `db:migrate` (forward to `@nexus/api`), `e2e` (forward to `@nexus/web`).
- `tsconfig.base.json`: `strict`, `module`/`moduleResolution` `NodeNext`, `target` `ES2023`, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `skipLibCheck`.
- `.env.example`: `DATABASE_URL=`, `DATABASE_URL_UNPOOLED=`, `NEON_BRANCH=`, `PORT=`, `HOST=`, `WEB_DIST_DIR=`.

- [ ] **Step 1:** Create branch `chore/monorepo-scaffold` from `docs/project-setup`.
- [ ] **Step 2:** Create the files above; `pnpm add -Dw @biomejs/biome typescript`. Biome: formatter on, 2-space indent, `lineEnding: "lf"`, ignore `dist`, `node_modules`, `src/infrastructure/db/migrations/meta`, `playwright-report`, `test-results`.
- [ ] **Step 3:** Renormalize existing files to LF: `git add --renormalize .`
- [ ] **Step 4: Verify** — `pnpm install` succeeds; `pnpm lint` exits 0; `git ls-files --eol | grep -v "i/lf"` prints nothing for text files.
- [ ] **Step 5:** Add the command list to `CLAUDE.md`, replacing "Exact commands are listed here once the repo is scaffolded."
- [ ] **Step 6: Commit** — `chore: set up pnpm workspace, Biome and TypeScript base config`

### Task 2: Shared health contract

**Files:**
- Create: `packages/shared/{package.json,tsconfig.json,src/index.ts,src/health.ts,src/health.test.ts}`

**Interfaces:**
- Produces: `healthResponseSchema` (Zod) and `type HealthResponse = { status: "ok" | "degraded"; database: "ok" | "unavailable" }`, exported from `@nexus/shared`.
- Scripts: `build` (`tsc -p tsconfig.json` → `dist/`), `typecheck` (`tsc --noEmit`), `test` (`vitest run`).

- [ ] **Step 1: Write the failing test** `health.test.ts`:
  - `parses a healthy response` — `healthResponseSchema.parse({ status: "ok", database: "ok" })` equals its input.
  - `rejects an unknown status` — `safeParse({ status: "fine", database: "ok" }).success === false`.
- [ ] **Step 2:** `pnpm --filter @nexus/shared test` → FAIL (module not found).
- [ ] **Step 3:** Implement `src/health.ts`; re-export from `src/index.ts`. Add `zod` as a dependency.
- [ ] **Step 4:** Test passes; `pnpm --filter @nexus/shared build` produces `dist/index.js` and `dist/index.d.ts`.
- [ ] **Step 5: Commit** — `feat(shared): add health response contract`

### Task 3: API skeleton — config and health route

**Files:**
- Create: `apps/api/{package.json,tsconfig.json,vitest.config.ts}`, `src/server.ts`, `src/app.ts`, `src/infrastructure/env-file.ts`, `src/infrastructure/config.ts`, `src/modules/health/routes.ts`, `test/config.test.ts`, `test/health.test.ts`

**Interfaces:**
- Consumes: `healthResponseSchema`, `HealthResponse` from `@nexus/shared`.
- Produces:
  - `loadEnvFileIfPresent(path: string): void` — calls `process.loadEnvFile(path)` only if the file exists; never overrides variables already set.
  - `type AppConfig = { nodeEnv: "development" | "test" | "production"; host: string; port: number; databaseUrl: string; webDistDir: string | undefined }`
  - `loadConfig(env: NodeJS.ProcessEnv): AppConfig` — defaults: `nodeEnv` `"development"`, `port` `3000`, `host` `"0.0.0.0"` in production else `"127.0.0.1"`; `databaseUrl` from `DATABASE_URL` (required); `webDistDir` from `WEB_DIST_DIR`. Throws `ConfigError` whose message lists offending variable **names** only.
  - `buildApp(options: { config: AppConfig; checkDatabase: () => Promise<boolean> }): Promise<FastifyInstance>` — registers the health module under `/api`; performs no I/O itself.
  - `GET /api/health` → `200 { status: "ok", database: "ok" }` or `503 { status: "degraded", database: "unavailable" }`. A `checkDatabase` that rejects, returns `false`, or doesn't settle within **2000 ms** counts as unavailable.
  - `server.ts`: `loadEnvFileIfPresent(<repo root>/.env.local)` → `loadConfig(process.env)` → `createDatabase` (Task 4) → `buildApp` → `listen`. Until Task 4 lands, pass `checkDatabase: async () => false`.
- Scripts: `dev` (`tsx watch --conditions=development src/server.ts`), `build` (`tsc`), `start` (`node dist/server.js`), `typecheck`, `test` (`vitest run`).

- [ ] **Step 1: Write failing tests**
  - `config.test.ts`:
    - `applies defaults` — `loadConfig({ DATABASE_URL: "postgres://u:p@h/db" })` → `{ nodeEnv: "development", port: 3000, host: "127.0.0.1", databaseUrl: "postgres://u:p@h/db", webDistDir: undefined }`.
    - `binds all interfaces in production` — with `NODE_ENV: "production"` → `host === "0.0.0.0"`.
    - `names missing variables without leaking values` — `loadConfig({ PORT: "abc", HOST: "secret-host-value" })` throws `ConfigError`; message contains `DATABASE_URL` and `PORT`, does not contain `secret-host-value` or `abc`.
  - `health.test.ts` (uses `app.inject`, no real DB):
    - `reports ok when the database answers` — `checkDatabase: async () => true` → status `200`, body `{ status: "ok", database: "ok" }`.
    - `reports degraded when the database check throws` — rejecting check → `503`, body `{ status: "degraded", database: "unavailable" }`.
    - `does not hang on a stuck database` — `checkDatabase: () => new Promise(() => {})` → `503` and the request completes in under `2500` ms (use Vitest fake timers or measure real time).
- [ ] **Step 2:** `pnpm --filter @nexus/api test` → FAIL.
- [ ] **Step 3:** Implement the files above (`fastify`, `zod` deps; `tsx`, `vitest`, `@types/node` dev deps).
- [ ] **Step 4:** Tests pass; `pnpm --filter @nexus/api typecheck` passes.
- [ ] **Step 5: Commit** — `feat(api): add Fastify app, config loading and health route`

### Task 4: Database tooling and isolated test databases

**Files:**
- Create: `apps/api/drizzle.config.ts`, `src/infrastructure/db/{client.ts,migrate.ts,schema/index.ts}`, `src/infrastructure/db/migrations/` (generated), `test/test-database.ts`, `test/database.test.ts`, `docs/guides/local-development.md`
- Modify: `apps/api/src/server.ts` (real `checkDatabase`), `CHANGELOG.md`

**Interfaces:**
- Consumes: `AppConfig` (Task 3).
- Produces:
  - `type Database = { db: PostgresJsDatabase; close(): Promise<void> }`
  - `createDatabase(url: string, options?: { searchPath?: string }): Database` — postgres.js client; `searchPath` sets the connection's `search_path`.
  - `checkDatabase(database: Database): Promise<boolean>` — runs `select 1`; returns `false` on error.
  - `migrate.ts` — CLI: loads `.env.local`, applies migrations from `src/infrastructure/db/migrations` using `DATABASE_URL_UNPOOLED`, exits non-zero on failure. Exported `runMigrations(database: Database, options?: { migrationsSchema?: string }): Promise<void>` for tests.
  - `createTestDatabase(): Promise<{ database: Database; schemaName: string; cleanup(): Promise<void> }>` — uses `DATABASE_URL_UNPOOLED`; throws if `NODE_ENV === "production"` or the URL is missing; creates schema `test_<epochMillis>_<8 hex chars>`, runs migrations into it (`migrationsSchema` = same schema), `cleanup` drops **only that schema** `CASCADE` and closes the client.
  - `pruneStaleTestSchemas(database: Database, olderThanMs = 3_600_000): Promise<string[]>` — drops schemas matching `^test_(\d+)_[0-9a-f]{8}$` whose timestamp is older than the threshold; returns dropped names. Called from a Vitest `globalSetup` in `apps/api`.
- Scripts in `@nexus/api`: `db:generate` (`drizzle-kit generate`), `db:migrate` (`tsx src/infrastructure/db/migrate.ts`). `drizzle.config.ts` reads `DATABASE_URL_UNPOOLED`, dialect `postgresql`, schema `./src/infrastructure/db/schema/index.ts`, out `./src/infrastructure/db/migrations`.

- [ ] **Step 1:** Generate the initial no-op migration so a journal exists: `pnpm --filter @nexus/api exec drizzle-kit generate --custom --name init` and put `SELECT 1;` in it with a comment that real tables arrive with the data-model plan.
- [ ] **Step 2: Write failing tests** `database.test.ts` (skipped with a clear message when `DATABASE_URL_UNPOOLED` is unset):
  - `connects to Postgres 18 or newer` — `select current_setting('server_version_num')::int` ≥ `180000`.
  - `generates UUIDv7 natively` — `select uuidv7()::text as id`; the 15th character (version nibble) is `"7"`.
  - `isolates each run in its own schema` — inside a test DB, `current_schema()` equals `schemaName` and matches `/^test_\d+_[0-9a-f]{8}$/`; after `cleanup()` the schema no longer exists (checked from a second connection).
  - `prunes only stale test schemas` — create `test_<now − 2h>_aaaaaaaa` and `test_<now>_bbbbbbbb`; `pruneStaleTestSchemas` returns only the first; the second still exists (clean it up after).
  - `refuses to run in production` — with `NODE_ENV` set to `"production"`, `createTestDatabase()` rejects; restore afterwards.
  - Extend `health.test.ts`: `reports ok against the real database` — `buildApp` with `checkDatabase` bound to a test database → `200`.
- [ ] **Step 3:** Run → FAIL.
- [ ] **Step 4:** Implement (`drizzle-orm`, `postgres` deps; `drizzle-kit` dev dep). Wire `server.ts` to `createDatabase(config.databaseUrl)` and close it on `SIGINT`/`SIGTERM`.
- [ ] **Step 5:** Tests pass against Neon; `pnpm db:migrate` applies the init migration to the Neon `main` branch and is a no-op on a second run.
- [ ] **Step 6:** Write `docs/guides/local-development.md`: prerequisites (Node 24, pnpm, `neon login`/`neon init`), `pnpm install`, `pnpm db:migrate`, `pnpm dev`, how tests use throwaway schemas, how to reset (`neon branches reset` or drop schemas). Add a CHANGELOG line.
- [ ] **Step 7: Commit** — `feat(api): add Drizzle tooling and isolated test databases`

### Task 5: Web app skeleton

**Files:**
- Create: `apps/web/{package.json,tsconfig.json,vite.config.ts,index.html}`, `src/main.tsx`, `src/App.tsx`, `src/styles/theme.css`, `src/lib/api.ts`, `src/features/health/HealthStatus.tsx`, `src/features/health/HealthStatus.test.tsx`

**Interfaces:**
- Consumes: `healthResponseSchema` from `@nexus/shared`; `GET /api/health` (Task 3).
- Produces:
  - `getJson<T>(path: string, schema: ZodType<T>): Promise<T>` — fetches, parses with the schema; a `503` with a body that matches the schema still resolves (health uses that), other non-2xx statuses throw.
  - `<HealthStatus />` — TanStack Query `useQuery({ queryKey: ["health"], ... })`. Texts: loading `Checking API…`; `ok` → `API: ok · Database: ok`; `degraded` → `API: ok · Database: unavailable`; fetch failure → `API unreachable`.
  - `App` renders the heading `NEXUS` and `<HealthStatus />` inside `QueryClientProvider`.
  - `theme.css`: `@import "tailwindcss";` plus `@theme` tokens `--color-background`, `--color-foreground`, `--color-muted`, with dark values under `prefers-color-scheme: dark`. Components use only these tokens.
  - `vite.config.ts`: React, `@tailwindcss/vite`, `vite-plugin-pwa` (`registerType: "autoUpdate"`, manifest `name`/`short_name` `NEXUS`, `display: "standalone"`, no icons yet), dev proxy `/api` → `http://127.0.0.1:3000`, Vitest `environment: "jsdom"`.
- Scripts: `dev` (`vite`), `build` (`tsc --noEmit && vite build`), `typecheck`, `test` (`vitest run`).

- [ ] **Step 1: Write failing tests** `HealthStatus.test.tsx` (mock `fetch`, fresh `QueryClient` with `retry: false` per test):
  - `shows ok state` — 200 `{status:"ok",database:"ok"}` → text `API: ok · Database: ok`.
  - `shows degraded state` — 503 `{status:"degraded",database:"unavailable"}` → `API: ok · Database: unavailable`.
  - `shows unreachable on network error` — fetch rejects → `API unreachable`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement (`react`, `react-dom`, `@tanstack/react-query`, `zod`, `@nexus/shared` deps; `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `vite-plugin-pwa`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` dev deps).
- [ ] **Step 4:** Tests pass; `pnpm dev` → `http://localhost:5173` shows `NEXUS` and `API: ok · Database: ok`.
- [ ] **Step 5: Commit** — `feat(web): add React app with health status`

### Task 6: API serves the built web app

**Files:**
- Create: `apps/api/src/infrastructure/web-app.ts`, `apps/api/test/web-app.test.ts`
- Modify: `apps/api/src/app.ts`

**Interfaces:**
- Consumes: `AppConfig.webDistDir` (Task 3).
- Produces: `registerWebApp(app: FastifyInstance, distDir: string): Promise<void>` — called by `buildApp` only when `config.webDistDir` is set. Serves static files via `@fastify/static`; a `GET` that matches no file and no route returns `index.html` **only** when the path is not under `/api/` and has no file extension; everything else 404s. Unknown `/api/*` → `404 { error: "not_found" }`.

- [ ] **Step 1: Write failing tests** `web-app.test.ts` (fixture dist in a temp dir with `index.html` and `assets/app.js`):
  - `serves index.html at /` — 200, `text/html`.
  - `serves static assets` — `/assets/app.js` → 200, JavaScript content type.
  - `falls back to index.html for client routes` — `/inventory/items/123` → 200 HTML.
  - `404s missing assets instead of returning HTML` — `/assets/missing.js` → 404.
  - `returns JSON 404 for unknown API routes` — `/api/nope` → 404 `{ error: "not_found" }`.
  - `still serves the health route` — `/api/health` → JSON, not HTML.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement (`@fastify/static` dep).
- [ ] **Step 4:** Tests pass. `pnpm build`, then `WEB_DIST_DIR=apps/web/dist pnpm --filter @nexus/api start` serves the app on `http://localhost:3000`.
- [ ] **Step 5: Commit** — `feat(api): serve the built web app with SPA fallback`

### Task 7: End-to-end smoke test and CI

**Files:**
- Create: `apps/web/playwright.config.ts`, `apps/web/e2e/smoke.spec.ts`, `.github/workflows/ci.yml`
- Modify: `CHANGELOG.md`, `docs/guides/local-development.md` (e2e section)

**Interfaces:**
- Consumes: root scripts (Task 1), `start` + `WEB_DIST_DIR` (Task 6).
- Playwright `webServer`: runs `pnpm --filter @nexus/api start` with `WEB_DIST_DIR` pointing at `apps/web/dist`, waits for `http://127.0.0.1:3000/api/health`; Chromium only. `@nexus/web` script `e2e` = `playwright test`.
- CI (`on: pull_request`, `push` to `main`): job on `ubuntu-latest` with service `postgres:18` (user/password/db `nexus`, health-checked); env `DATABASE_URL` and `DATABASE_URL_UNPOOLED` both `postgres://nexus:nexus@localhost:5432/nexus`, `NODE_ENV=test`. Steps: checkout → `pnpm/action-setup` (version from `packageManager`) → `actions/setup-node` (Node 24, pnpm cache) → `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` → `pnpm build` → `pnpm db:migrate` → `pnpm test` → `pnpm --filter @nexus/web exec playwright install --with-deps chromium` → `pnpm e2e`.

- [ ] **Step 1: Write the test** `smoke.spec.ts` — `home page shows healthy API`: visit `/`, expect heading `NEXUS` and text `API: ok · Database: ok`.
- [ ] **Step 2:** `pnpm --filter @nexus/web exec playwright install chromium`, then `pnpm build && pnpm e2e` → PASS.
- [ ] **Step 3:** Write `ci.yml`. Verify locally by running the same sequence: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm build && pnpm db:migrate && pnpm test && pnpm e2e` — all exit 0. (CI itself is first verified on the PR, once the user pushes.)
- [ ] **Step 4:** Docs: e2e section in the local-development guide; CHANGELOG line.
- [ ] **Step 5: Commit** — `ci: add Playwright smoke test and GitHub Actions workflow`
