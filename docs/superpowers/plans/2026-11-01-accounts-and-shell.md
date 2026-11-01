# Accounts, Household and App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The owner can create an account (allowlisted email only), sign in with password or Google, protect password sign-in with TOTP, and land in a Graphite-dark app shell (sidebar / bottom bar, Home, Settings, ⓘ) backed by a household, tenancy checks, the entity + event history pattern, an audit log and idempotent writes.

**Architecture:** The web app gets a shared UI kit ported from `../ImperiorProject` (de-branded, i18n removed) and a router-based shell. The API mounts Better Auth under `/api/auth/*` (Drizzle adapter, two-factor plugin), resolves a household member for every NEXUS request, and writes state + event + audit in one transaction. New code lives in `apps/api/src/modules/{auth,households}` and `apps/api/src/infrastructure/{db,client-address,idempotency}`.

**Tech Stack:** Better Auth (+ `twoFactor` plugin, `better-auth/react` client), `uuidv7`, Drizzle, Fastify 5, Zod 4, React 19, `react-router-dom` 7, `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `sonner`, `@tanstack/react-table`, `tw-animate-css`; dev: `otpauth`. Install the latest stable version of each.

**Spec:** `docs/superpowers/specs/2026-11-01-accounts-and-shell-design.md` (read it with this plan). Also `CLAUDE.md` and ADRs 0004, 0005, 0007, 0011.

## Global Constraints

- Branch `feat/accounts-and-shell`. Commit after each task; never push.
- Every task finishes with `pnpm lint && pnpm typecheck && pnpm test` green; tasks touching the web also `pnpm build`.
- If `graphify-out/graph.json` exists, `graphify query` before searching code; `graphify update .` after changing code.
- IDs: UUIDv7. DB columns `uuid`, default `uuidv7()` (Postgres 18); app-side generation with the `uuidv7` package (also Better Auth's `advanced.database.generateId`).
- Timestamps `timestamptz`, UTC.
- Every household-owned row carries `household_id`. No query helper without household scope.
- Migrations: `pnpm db:generate`, review the SQL, commit; apply with `pnpm db:migrate`; never at startup. Append-only.
- API errors are `{ "error": { "code": string, "message": string } }`.
- Env vars added to `.env.example` blank: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `SIGNUP_ALLOWED_EMAILS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Never log or commit values.
- UI: English only; no hex/rgb literals, no `text-[NNpx]`, no page-level colours in components — theme tokens only. No Imperior names, brand tokens, FLOW references or `@/i18n` imports anywhere in `apps/web/src`.
- 2FA applies to password sign-in only; Google sign-ins are not challenged (owner's decision).
- Docs per `CLAUDE.md`: each task adds its `CHANGELOG.md` line under `## 2026-11-01` and updates the docs it names.

## Review Focus

1. **Email spelling at sign-up** — `" Owner@Example.com "` must match allowlist entry `owner@example.com`, and the account is stored lower-cased; a different email is refused for password and OAuth alike. Test in Task 4.
2. **Spoofed `X-Real-IP` off Railway** — a client sending `X-Real-IP` to a non-Railway server must not change its rate-limit identity; a client-sent `x-nexus-client-address` is always discarded. Test in Task 4.
3. **Household and profile names** — whitespace-only or >100-character names are a 400 with a readable message; surrounding whitespace is trimmed; emoji and non-Latin text are accepted. Test in Task 7.
4. **Retried or double-clicked saves** — the same `Idempotency-Key` replays the first response without a second write; same key with a different body is 422; a concurrent duplicate is 409. Test in Task 7.
5. **Session ending mid-use** — when `/api/me` starts returning 401 (signed out elsewhere, expired), the web app goes to `/sign-in` instead of showing an error state; a long name/email in the profile chip truncates at 375px instead of overflowing. Tests in Tasks 9 and 3.

---

## File Structure

```
apps/web/src/
  styles/theme.css                 Graphite tokens + surface utilities (replaces current)
  lib/{utils,stored-state,api,auth-client,page-info}.ts
  hooks/{useIsMobile,useStoredState,useDebouncedValue,useMe}.ts
  components/ui/*.tsx              ported kit (Tasks 1–2)
  components/layout/*.tsx          shell (Task 3)
  features/home/HomePage.tsx
  features/settings/{SettingsPage,ProfileSection,PasswordSection,TwoFactorSection,SessionsSection,HouseholdSection}.tsx
  features/auth/{SignInPage,TwoFactorStep,RequireSession}.tsx
  features/health/HealthStatus.tsx (moves into Settings › About)
  router.tsx, App.tsx
  kit-hygiene.test.ts              guard for AC 7
apps/api/src/
  infrastructure/config.ts         + auth/google/allowlist/railway fields
  infrastructure/client-address.ts
  infrastructure/idempotency.ts
  infrastructure/db/schema/{auth,households,entities,audit,idempotency,index}.ts
  infrastructure/db/transaction.ts
  modules/auth/{auth,routes,allowlist,audit-hooks}.ts
  modules/households/{membership,authorization,history,audit,routes}.ts
  cli/reset-password.ts
packages/shared/src/{errors,me,household,events}.ts
```

---

### Task 1: Graphite tokens and kit primitives

**Files:**
- Modify: `apps/web/src/styles/theme.css`, `apps/web/tsconfig.json`, `apps/web/vite.config.ts`, `apps/web/package.json`
- Create from Imperior `frontend/src/components/ui/`: `button, input, label, textarea, select, switch, segmented, tabs, badge, card, menu, toggle-chip, sonner` → `apps/web/src/components/ui/`
- Create from Imperior `frontend/src/lib/`, `frontend/src/hooks/`: `lib/utils.ts`, `lib/stored-state.ts`, `hooks/useIsMobile.ts`, `hooks/useStoredState.ts`, `hooks/useDebouncedValue.ts` with their tests
- Create: `apps/web/src/kit-hygiene.test.ts`, `docs/decisions/0012-ui-kit-from-imperior.md`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` (tailwind-merge config knows `text-caption`, `text-micro`); `useIsMobile(): boolean` (below 768px); `useStoredState<T>(key: string, initial: T)`; `useDebouncedValue<T>(value: T, ms: number): T`; components with Imperior's props unchanged unless a step says otherwise. Import alias `@/*` → `apps/web/src/*`.

- [ ] **Step 1: Write `kit-hygiene.test.ts`** — reads every `.ts/.tsx/.css` under `src/` (via `import.meta.glob(..., { query: "?raw", eager: true })`) except `styles/theme.css` and test files, and asserts none match: `/#[0-9a-fA-F]{3,8}\b/`, `/\brgba?\(/`, `/text-\[\d+px\]/`, `/@\/i18n/`, `/Imperior|FLOW\b/`, `/--brand/`. A second assertion: `theme.css` contains no `--brand`, `app-backdrop`, `card-from`.
- [ ] **Step 2: Run** `pnpm --filter @nexus/web test -- kit-hygiene` — expect PASS now (nothing ported yet); it must keep passing after each port.
- [ ] **Step 3: Add deps and alias** — the runtime deps listed in Tech Stack (web ones); `paths: { "@/*": ["./src/*"] }` in tsconfig and `resolve.alias` `@` → `src` in `vite.config.ts`.
- [ ] **Step 4: Rewrite `theme.css`** — same token *names* as Imperior's `@theme` block (`--color-background`, `card`, `popover`, `primary`, `muted`, `muted-foreground`, `accent`, `destructive`, `border`, `input`, `ring`, `success`, `warning`, `--text-caption: 11px`, `--text-micro: 10px`, radii, sidebar widths, `--nav-<family>-1..4` for families `blue|cyan|violet|emerald|orange|slate`) with Graphite values: background `#121417`, sidebar `#181b1f`, card `#1a1d21`, border `#262a30`, foreground `#e6e8eb`, muted-foreground `#9aa1a9`, accent `#8cc4ff` on `#23303d`, warning `#f0b45a`; primary = foreground on background (light button, as Imperior). Dark only: drop the `prefers-color-scheme` block. Port the `surface-card`, `surface-interactive`, `surface-solid` utilities as flat Graphite surfaces (card colour + 1px border; `surface-solid` adds a shadow) — no gradients, no backdrop photo.
- [ ] **Step 5: Port the primitives and hooks** — copy, then: replace i18n calls with English strings; delete Imperior ADR comments; replace any hex/`rgb()`/`--brand*` with tokens; drop variants that only exist for Imperior domains (`button` keeps `default, outline, secondary, ghost, destructive, link, danger, success`; drop `info`/`tone`); run `pnpm format`. Port each file's existing test.
- [ ] **Step 6: Run** `pnpm --filter @nexus/web test && pnpm --filter @nexus/web typecheck && pnpm lint` — expect PASS.
- [ ] **Step 7: ADR 0012** — context (owner's prior components), decision (copy Imperior's kit into `apps/web`, de-branded, Graphite dark, no i18n; Base UI primitives styled by NEXUS tokens), alternatives (build from scratch; shadcn defaults), consequences (no shared package with Imperior; changes don't flow back). CHANGELOG line.
- [ ] **Step 8: Commit** `feat(web): port shared UI primitives with Graphite tokens`

### Task 2: Composite kit components and the design-system reference

**Files:**
- Create from Imperior `components/ui/`: `form-field, form-section, section-form, pending-changes-bar, responsive-dialog, bottom-sheet, confirm-dialog, unsaved-changes-dialog, page-header, page-info, page-utilities, empty-state, loading-state, error-state, error-boundary, data-table, table, table-cards, surface-list, filter-bar, filter-search, filter-select, search-input, multi-select, searchable-select` (+ their tests)
- Create: `apps/web/src/lib/page-info.ts`, `docs/reference/design-system.md`

**Interfaces:**
- Consumes: Task 1 primitives, `cn`, `useIsMobile`.
- Produces: `type PageInfo = { title: string; summary: string; points: string[] }`; `PAGE_INFO: Record<PageId, PageInfo>` with `type PageId = "home" | "settings"`; `<PageInfoButton page: PageId />` (opens a `ResponsiveDialog` with the text); `<PageHeader title description? actions? page: PageId />` renders the ⓘ; `PageUtilities` keeps the ⓘ only (no notification bell — no notifications yet).

- [ ] **Step 1: Write the failing test** `components/ui/page-info.test.tsx`: rendering `<PageHeader title="Home" page="home" />` shows a button named "About this page"; clicking it shows `PAGE_INFO.home.title` and every string in `PAGE_INFO.home.points`.
- [ ] **Step 2: Run** `pnpm --filter @nexus/web test -- page-info` — expect FAIL (module missing).
- [ ] **Step 3: Port the components** with the same transforms as Task 1; replace Imperior's translation-key `PAGE_INFO` with the plain-English record above (texts for `home` and `settings` per the spec's Screens section); strip role/permission filtering from page-info; drop the bell from `page-utilities`. Keep ported tests passing (`multi-select`, `filter-bar`, `filter-search`, `searchable-select`, `error-boundary`).
- [ ] **Step 4: Run** `pnpm --filter @nexus/web test` — expect PASS including `kit-hygiene`.
- [ ] **Step 5: Write `docs/reference/design-system.md`** — adapted from Imperior's `design-system.md` + `responsive-layout.md`: page anatomy, surfaces (flat Graphite), status-colour rule (green live/done, amber attention, red stopped, grey inactive; accent blue is selection/focus, never status), type sizes, no page-level styling, phone rules (16px inputs, 36px targets, `md` the only shell breakpoint), and a component catalog listing every file in `components/ui` with one line each. Present tense, no Imperior ADR links. CHANGELOG line.
- [ ] **Step 6: Commit** `feat(web): port composite components and document the design system`

### Task 3: App shell, routing, Home and Settings placeholders

**Files:**
- Create from Imperior `components/layout/`: `AppLayout, Sidebar, SidebarHeader, BottomNav, NavItem, NavGroup, NavIconTile, ShellContext, Toolbar, ProfileChip`; new `nav-config.ts`
- Create: `apps/web/src/router.tsx`, `features/home/HomePage.tsx`, `features/settings/SettingsPage.tsx`
- Modify: `apps/web/src/App.tsx`, `apps/web/e2e/smoke.spec.ts`, `apps/web/playwright.config.ts`
- Test: `components/layout/AppLayout.test.tsx`, `components/layout/ProfileChip.test.tsx`

**Interfaces:**
- Produces: `type NavEntry = { id: PageId; path: string; icon: LucideIcon; label: string; shortLabel?: string; end?: boolean }`; `NAV_ENTRIES: NavEntry[]` = Home (`/`, end), Settings (`/settings`); `<AppLayout>` renders `<Outlet/>`; `ProfileChip` props `{ name: string; email: string }`. Router: `createBrowserRouter` with `/` and `/settings` under `AppLayout` (auth guard added in Task 9).

- [ ] **Step 1: Write failing tests** — `AppLayout.test.tsx`: at desktop width (mock `useIsMobile` false) a `navigation` landmark lists "Home" and "Settings" and no element with name /scan/i; at phone width (true) a bottom bar lists the same entries and the sidebar is absent. `ProfileChip.test.tsx`: a 120-character name renders with the `truncate` class and the full name in `title`.
- [ ] **Step 2: Run** them — expect FAIL.
- [ ] **Step 3: Port the layout** — remove permissions, roles, badges/unread hooks, impersonation, entity panel slot, backdrop and i18n; nav groups collapse to one ungrouped list; the bottom bar has no central button (it returns with scanning). `SidebarHeader` shows the text wordmark "NEXUS". `HomePage`: `PageHeader title="Home" page="home"` + `EmptyState` "Nothing here yet — inventory is coming". `SettingsPage`: `PageHeader page="settings"` + an "About" card holding the existing `HealthStatus`.
- [ ] **Step 4: Run** `pnpm --filter @nexus/web test` — expect PASS.
- [ ] **Step 5: Update e2e** — add a `mobile` project (`devices["Pixel 7"]`); smoke test: `/` shows heading "Home"; navigating to Settings shows "API: ok · Database: ok"; on `mobile` the bottom bar is visible. Run `pnpm build && pnpm e2e` — expect PASS. (This smoke test is replaced by the signed-in flow in Task 10.)
- [ ] **Step 6: Docs** — `docs/features/shell/app-shell.md` (nav, phone vs desktop, ⓘ pattern); CHANGELOG line.
- [ ] **Step 7: Commit** `feat(web): app shell with sidebar, bottom bar, Home and Settings`

### Task 4: Better Auth with email + password, allowlist and client address

**Files:**
- Create: `apps/api/src/modules/auth/{auth.ts,routes.ts,allowlist.ts}`, `apps/api/src/infrastructure/client-address.ts`, `apps/api/src/infrastructure/db/schema/auth.ts`, migration `0001_*`
- Modify: `apps/api/src/infrastructure/config.ts`, `apps/api/src/app.ts`, `apps/api/src/server.ts`, `apps/api/test/health.test.ts`, `.env.example`, `docs/guides/local-development.md`
- Test: `apps/api/test/{config,allowlist,client-address,auth}.test.ts`

**Interfaces:**
- Produces:
  - `AppConfig` gains `authSecret: string` (`BETTER_AUTH_SECRET`, ≥32 chars, required), `authUrl: string` (`BETTER_AUTH_URL`; required in production, default `http://localhost:5173`), `signupAllowedEmails: string[]` (`SIGNUP_ALLOWED_EMAILS`, comma-separated, trimmed, lower-cased; blank → `[]`), `google: { clientId: string; clientSecret: string } | undefined` (both or neither, else `ConfigError` naming both), `trustRailwayProxy: boolean` (`RAILWAY_ENVIRONMENT_ID` or `RAILWAY_ENVIRONMENT` set).
  - `normalizeEmail(email: string): string`; `isSignupAllowed(email: string, allowlist: string[]): boolean`.
  - `registerClientAddress(app, { trustRailwayProxy: boolean })` decorating `request.clientAddress: string`.
  - `createAuth(database: Database, config: AppConfig)` → Better Auth instance; `type Auth = ReturnType<typeof createAuth>`.
  - `BuildAppOptions` becomes `{ config: AppConfig; database: Database; checkDatabase?: () => Promise<boolean> }` (default `checkDatabase(database)`); `buildApp` decorates `app.auth: Auth`.

- [ ] **Step 1: Write failing unit tests** — `allowlist.test.ts`: `isSignupAllowed(" Owner@Example.com ", ["owner@example.com"])` is true; `isSignupAllowed("other@example.com", ["owner@example.com"])` false; empty allowlist refuses all. `config.test.ts`: lists parse/normalise; only `GOOGLE_CLIENT_ID` set → `ConfigError` mentioning `GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET`; short secret → error naming `BETTER_AUTH_SECRET` only, no value in the message; production without `BETTER_AUTH_URL` → error. `client-address.test.ts`: with `trustRailwayProxy: false`, `X-Real-IP: 203.0.113.9` → `clientAddress` equals `request.ip`; with `true` → `203.0.113.9`; `X-Real-IP: fe80::1%eth0` or `not-an-ip` → falls back; `::ffff:198.51.100.2` normalises to `198.51.100.2`.
- [ ] **Step 2: Run** `pnpm --filter @nexus/api test -- allowlist config client-address` — expect FAIL.
- [ ] **Step 3: Implement** config fields, `allowlist.ts`, `client-address.ts` (port of Imperior `plugins/client-address.ts`, `node:net` `isIP`, own `normalizedIp`).
- [ ] **Step 4: Run** the same tests — expect PASS.
- [ ] **Step 5: Better Auth instance** — `createAuth`: Drizzle adapter (`provider: "pg"`), `emailAndPassword: { enabled: true }`, `basePath: "/api/auth"`, `baseURL: config.authUrl`, `secret`, `advanced.database.generateId: () => uuidv7()`, `advanced.ipAddress.ipAddressHeaders: ["x-nexus-client-address"]`, `rateLimit.enabled: true`, `databaseHooks.user.create.before`: lower-case the email and throw `APIError("FORBIDDEN", { message: "This account can't be created." })` unless `isSignupAllowed`. Generate the auth tables with the Better Auth CLI into `schema/auth.ts`, switch `id`/FK columns to `uuid` with default `uuidv7()`, export from `schema/index.ts`, `pnpm db:generate`, review SQL.
- [ ] **Step 6: Mount** — `routes.ts` registers `GET|POST /api/auth/*`, builds a Fetch `Request` from the Fastify request, **deletes any incoming `x-nexus-client-address` and sets it to `request.clientAddress`**, calls `auth.handler`, copies status/headers (all `set-cookie`)/body back. `app.ts` registers client address first. Update `server.ts` and `health.test.ts` to pass `database` (`createDatabase("postgres://user@127.0.0.1:1/unused")` is fine: postgres.js connects lazily).
- [ ] **Step 7: Write failing integration tests** `auth.test.ts` (skipIf no `DATABASE_URL_UNPOOLED`, `createTestDatabase()` per test, allowlist `["owner@example.com"]`): `POST /api/auth/sign-up/email` with `" Owner@Example.com "` → 200, the stored user's email is `owner@example.com`, a session cookie is set with `HttpOnly` and `SameSite=Lax` (and `Secure` when `nodeEnv` is production); `other@example.com` → 403 and no user row; sign-in with the right password → 200, wrong password → 401; a request sending `x-nexus-client-address: 1.2.3.4` is rate-limited under its real address (send >limit wrong-password attempts alternating the spoofed header; the later ones are 429).
- [ ] **Step 8: Run** `pnpm db:migrate` is **not** needed (tests migrate their own DB); `pnpm --filter @nexus/api test -- auth` — expect PASS after Steps 5–6.
- [ ] **Step 9: Docs** — `.env.example` keys; `local-development.md`: generate `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), set `SIGNUP_ALLOWED_EMAILS`, `BETTER_AUTH_URL=http://localhost:5173`; `docs/features/accounts/sign-in.md`; CHANGELOG line.
- [ ] **Step 10: Commit** `feat(api): Better Auth email sign-in with sign-up allowlist`

### Task 5: Google sign-in (config-gated) and the OAuth guide

**Files:**
- Modify: `apps/api/src/modules/auth/auth.ts`
- Create: `apps/api/src/modules/auth/providers.ts` (`GET /api/auth-providers`), `packages/shared/src/me.ts` (provider schema part), `docs/guides/google-oauth-setup.md`
- Test: `apps/api/test/google.test.ts`

**Interfaces:**
- Produces: `authProvidersSchema = z.object({ google: z.boolean() })` in `@nexus/shared`; `GET /api/auth-providers` → `{ google: boolean }` (public).

- [ ] **Step 1: Write failing tests** — without `config.google`: `/api/auth-providers` → `{ google: false }`, `POST /api/auth/sign-in/social {provider:"google"}` → 4xx. With a fake `google` config: providers → `{ google: true }`; social sign-in returns a URL whose host is `accounts.google.com` and whose `redirect_uri` is `${authUrl}/api/auth/callback/google`. **Simulated callback:** through `(await auth.$context).internalAdapter.createOAuthUser(...)` (or the adapter call Better Auth uses for OAuth sign-up — the point is that DB hooks run) creating `stranger@example.com` → rejects; `owner@example.com` → user created.
- [ ] **Step 2: Run** — expect FAIL.
- [ ] **Step 3: Implement** `socialProviders.google` only when `config.google` is set; `account.accountLinking: { enabled: true, trustedProviders: ["google"] }` so Google links to the owner's existing password account; the providers route.
- [ ] **Step 4: Run** — expect PASS.
- [ ] **Step 5: Guide** `docs/guides/google-oauth-setup.md` — create a Google Cloud project and OAuth client (Web), consent screen in testing mode with the owner as test user, authorised origins and redirect URIs for dev (`http://localhost:5173/api/auth/callback/google`) and Railway (`https://<railway-domain>/api/auth/callback/google`), where to put the two env vars. Add `docs/integrations/google-oauth.md` (what NEXUS uses Google for, scopes `openid email profile`, no other data). CHANGELOG line.
- [ ] **Step 6: Commit** `feat(api): optional Google sign-in`

### Task 6: TOTP two-factor for password sign-in

**Files:**
- Modify: `apps/api/src/modules/auth/auth.ts`, `schema/auth.ts`, new migration
- Create: `docs/decisions/0013-two-factor-for-password-sign-in-only.md`
- Test: `apps/api/test/two-factor.test.ts`

**Interfaces:**
- Produces: Better Auth `twoFactor({ issuer: "NEXUS" })` endpoints under `/api/auth/two-factor/*` (enable, verify-totp, verify-backup-code, disable, generate-backup-codes); sign-in of a 2FA user returns `{ twoFactorRedirect: true }` without a full session.

- [ ] **Step 1: Write failing tests** (real test DB, `otpauth` to compute codes from the `totpURI` secret): enable with password → returns `totpURI` and 10 backup codes; verify a code → `twoFactorEnabled` true; next email sign-in → `twoFactorRedirect: true` and `GET /api/me`-equivalent `get-session` has no user; `verify-totp` with a wrong code → 401, right code → session; a backup code works once, the second use → 401; disabling requires the password.
- [ ] **Step 2: Run** — expect FAIL.
- [ ] **Step 3: Implement** — add the plugin, regenerate auth schema (two-factor table + `two_factor_enabled` column, uuid ids), `pnpm db:generate`, review.
- [ ] **Step 4: Run** — expect PASS.
- [ ] **Step 5: ADR 0013** — refines 0007: TOTP is available to every user and enforced on password sign-in; Google sign-ins rely on the Google account's 2FA (owner's decision, 2026-11-01); alternative (custom post-OAuth challenge gate) rejected for scope; consequence: the owner should keep 2FA on in Google. Update `docs/features/accounts/sign-in.md`; CHANGELOG line.
- [ ] **Step 6: Commit** `feat(api): TOTP two-factor for password sign-in`

### Task 7: Household, tenancy, history, audit and idempotency

**Files:**
- Create: `schema/{households,entities,audit,idempotency}.ts`, migration, `infrastructure/db/transaction.ts`, `infrastructure/idempotency.ts`, `modules/households/{membership,authorization,history,audit,routes}.ts`, `modules/auth/audit-hooks.ts`, `packages/shared/src/{errors,me,household,events}.ts`
- Create: `docs/decisions/0014-sharing-moves-out-of-v0-1.md`
- Modify: `docs/roadmap/README.md`
- Test: `apps/api/test/{membership,authorization,history,idempotency,me-routes,audit}.test.ts`

**Interfaces:**
- Schema (all `id uuid default uuidv7()`):
  - `entities(id pk, household_id, entity_type text, created_at, archived_at null)`
  - `households(id pk → entities.id, name text, created_at, updated_at)` — the household row is itself an entity (its `household_id` is its own id).
  - `household_members(id, household_id, user_id → user.id, role enum member_role('admin','member','guest'), created_at)`, unique `(household_id, user_id)`.
  - `properties(id → entities.id, household_id, name, created_at)`.
  - `events(id, household_id, entity_id → entities.id, event_type text, actor_user_id null, source text default 'user', occurred_at, recorded_at default now(), payload jsonb, correlation_id uuid null, idempotency_key text null)`, unique `(household_id, idempotency_key)` where not null.
  - `audit_logs` exactly as the spec's Audit log section.
  - `idempotency_keys(user_id, key text, route text, request_hash text, status_code int null, response_body jsonb null, created_at)`, pk `(user_id, key)`, index on `created_at`.
  - Enum `visibility('shared','private')` + `ownedRecordColumns()` returning `{ visibility, ownerMemberId }` columns for later domain tables.
- Functions:
  - `withTransaction<T>(db, fn: (tx: Tx) => Promise<T>): Promise<T>`
  - `type MemberContext = { userId: string; memberId: string; householdId: string; role: "admin" | "member" | "guest" }`
  - `ensureMembership(db, user: { id: string; name: string }): Promise<MemberContext>` — inside a transaction take `pg_advisory_xact_lock(hashtext(user_id))`, return the existing membership or create entity + household (`"My household"`) + admin member + `household.created` event + `member.added` audit.
  - `visibleTo(table: { householdId; visibility; ownerMemberId }, member: MemberContext): SQL` — household match AND (`shared` OR owner = member, guests: `shared` only).
  - `assertCanWrite(member: MemberContext, record: { householdId: string; visibility: "shared" | "private"; ownerMemberId: string | null }): void` — throws `ForbiddenError` for guests, other households, others' private records.
  - `assertRole(member, ...roles)`.
  - `createEntity(tx, { householdId, entityType, id? }): Promise<string>`; `recordEvent(tx, { householdId, entityId, eventType, actorUserId, payload, occurredAt?, correlationId?, idempotencyKey? }): Promise<void>` — validates `payload` with `eventPayloadSchemas[eventType]` from `@nexus/shared` (unknown type throws).
  - `writeAudit(tx, entry: AuditEntry): Promise<void>`.
  - Fastify `request.member: MemberContext` via preHandler `requireMember` (401 `unauthenticated` without a session; calls `ensureMembership`). Applied to every `/api` route except `/api/health`, `/api/auth/*`, `/api/auth-providers`.
  - Idempotency plugin: routes with `config: { idempotent: true }` honour an optional `Idempotency-Key` header (≤128 chars): first request inserts a pending row, stores status + body on completion; replay → stored response with header `Idempotent-Replayed: true`; same key, different `sha256(method+url+body)` → 422 `idempotency_key_reused`; pending row → 409 `request_in_progress`; each insert deletes rows older than 24 h.
  - Routes and `@nexus/shared` schemas: `GET /api/me` → `meSchema = { user: { id, name, email, twoFactorEnabled }, household: { id, name }, role }`; `PATCH /api/me/profile { name }` (idempotent, audit `profile.renamed`); `PATCH /api/household { name }` (idempotent, admin only, updates row + `household.renamed` event + audit, one transaction). `nameSchema = z.string().trim().min(1).max(100)`.
  - `audit-hooks.ts`: Better Auth `hooks.after` writing audit for `/change-password` (`password.changed`), `/two-factor/enable`/`disable` (`2fa.enabled`/`2fa.disabled`), `/revoke-sessions` (`sessions.revoked`), with `client_ip` and `user_agent`.

- [ ] **Step 1: Write failing tests**
  - `membership.test.ts`: first `ensureMembership` creates one household named "My household", role `admin`, one `household.created` event, one `member.added` audit row; ten concurrent calls for the same user → exactly one household.
  - `authorization.test.ts` (creates a scratch table `test_records` with `ownedRecordColumns()`-shaped columns via raw SQL in the test DB): two households A and B; `visibleTo` for an A member returns A's shared rows + own private rows, not B's, not another A member's private rows; guest sees shared only; `assertCanWrite` throws for guest, cross-household and others' private.
  - `history.test.ts`: `recordEvent` with an invalid payload throws and, inside `withTransaction`, the domain update is rolled back too (both or neither); unknown event type throws; duplicate `idempotencyKey` in one household fails.
  - `me-routes.test.ts`: signed-in owner `GET /api/me` → `meSchema`-valid body, role `admin`; no cookie → 401 `{ error: { code: "unauthenticated" } }`; with two signed-in users A and B, A's rename leaves B's household name unchanged and `GET /api/me` for B shows B's household (routes only ever act on the caller's own household); `PATCH /api/household` names `"  Kuća 🏠  "` → stored `"Kuća 🏠"`, `"   "` → 400 `validation_failed`, 101 chars → 400; a `member`-role caller → 403.
  - `idempotency.test.ts`: same key + body twice → one `household.renamed` event, second response has `Idempotent-Replayed: true`; same key, different body → 422; two concurrent identical requests → one 200 and one 409 or replay, never two events; a row older than 24 h is deleted on the next insert.
  - `audit.test.ts`: change-password and enabling 2FA each add one audit row with action, actor and `client_ip`.
- [ ] **Step 2: Run** `pnpm --filter @nexus/api test` — expect the new tests FAIL.
- [ ] **Step 3: Implement** schema → `pnpm db:generate` → review SQL (FKs, enum, partial unique index) → helpers → plugins → routes → audit hooks.
- [ ] **Step 4: Run** `pnpm --filter @nexus/api test && pnpm typecheck` — expect PASS.
- [ ] **Step 5: Docs** — ADR 0014 (sharing — invites, member management, guests, household switching — moves out of v0.1; supersedes that part of 0008); roadmap gains "Sharing with friends" (guests read-only, shopping-list add as an idea, manual "I'm home" switch as an idea); `docs/reference/data-model.md` (tables above), `docs/reference/api.md` (error shape, idempotency contract, `/api/me`, `/api/household`, `/api/me/profile`), `docs/features/accounts/household.md`; CHANGELOG line.
- [ ] **Step 6: Commit** `feat(api): household tenancy, event history, audit log and idempotent writes`

### Task 8: Password reset CLI

**Files:**
- Create: `apps/api/src/cli/reset-password.ts`; script `"reset-password": "tsx src/cli/reset-password.ts"` in `apps/api/package.json`
- Test: `apps/api/test/reset-password.test.ts`

**Interfaces:**
- Produces: `resetPassword(database: Database, auth: Auth, email: string): Promise<string>` — returns a new random 20-character password, stores its hash via Better Auth's password hasher on the user's `credential` account, revokes all the user's sessions, writes audit `password.reset_by_cli`. CLI prints the password once; unknown email → exit code 1 with "No account with that email".

- [ ] **Step 1: Write failing test** — after `resetPassword`, signing in with the old password → 401, with the returned one → 200; an existing session cookie is no longer valid; unknown email rejects.
- [ ] **Step 2: Run** — expect FAIL. **Step 3: Implement.** **Step 4: Run** — expect PASS.
- [ ] **Step 5: Docs** — `docs/guides/reset-a-password.md` (`pnpm --filter @nexus/api reset-password <email>`, run against the intended database only); CHANGELOG line.
- [ ] **Step 6: Commit** `feat(api): reset-password command`

### Task 9: Web sign-in, 2FA step and session guard

**Files:**
- Create: `apps/web/src/lib/auth-client.ts`, `hooks/useMe.ts`, `features/auth/{SignInPage,TwoFactorStep,RequireSession}.tsx`
- Modify: `apps/web/src/router.tsx`, `apps/web/src/lib/api.ts` (keep it; add `sendJson<T>(method: "PATCH" | "POST", path: string, body: unknown, schema: ZodType<T>, options?: { idempotencyKey?: string }): Promise<T>` and an `onUnauthorized` callback invoked on any 401), `components/layout/ProfileChip.tsx` wiring
- Test: `features/auth/SignInPage.test.tsx`, `features/auth/RequireSession.test.tsx`

**Interfaces:**
- Consumes: `meSchema`, `authProvidersSchema` (`@nexus/shared`); Better Auth endpoints from Tasks 4–6.
- Produces: `authClient = createAuthClient({ basePath: "/api/auth", plugins: [twoFactorClient()] })`; `useMe(): UseQueryResult<Me>` (query key `["me"]`, 401 → `null`, no retry on 401); `<RequireSession>` wraps the `AppLayout` routes and redirects to `/sign-in?next=<path>` when `useMe` is `null`; on any later 401 from the API client, `queryClient.setQueryData(["me"], null)`.

- [ ] **Step 1: Write failing tests** (mock `fetch`/`authClient`): `SignInPage` shows email, password, "Sign in" and a "Create account" switch; "Continue with Google" only when providers say `google: true`; a 403 on sign-up shows "This account can't be created."; a `twoFactorRedirect` response shows `TwoFactorStep` (6-digit code field + "Use a backup code" link); wrong code shows "That code didn't work". `RequireSession`: with `/api/me` → 401 the route renders the sign-in page with `next` preserved; after a successful `/api/me` the child renders; when a later request returns 401, the app navigates to `/sign-in`.
- [ ] **Step 2: Run** — expect FAIL.
- [ ] **Step 3: Implement** with kit components only (`Card`, `FormField`, `Input`, `Button`, `Segmented` for sign in / create account). Successful sign-in → `navigate(next ?? "/")` and invalidate `["me"]`. ProfileChip gets `name`/`email` from `useMe`.
- [ ] **Step 4: Run** `pnpm --filter @nexus/web test` — expect PASS.
- [ ] **Step 5: Docs** — update `docs/features/accounts/sign-in.md` (screens, create-account switch — a design call: the spec had no sign-up screen but the owner needs one to create the first account); CHANGELOG line.
- [ ] **Step 6: Commit** `feat(web): sign-in, create account and two-factor step`

### Task 10: Settings page and the signed-in e2e flow

**Files:**
- Create: `features/settings/{ProfileSection,PasswordSection,TwoFactorSection,SessionsSection,HouseholdSection}.tsx` (+ tests)
- Modify: `features/settings/SettingsPage.tsx`, `lib/page-info.ts`, `apps/web/playwright.config.ts`, `apps/web/e2e/*`
- Create: `apps/web/e2e/global-setup.ts`, `apps/web/e2e/global-teardown.ts`, `apps/api/scripts/e2e-database.ts`

**Interfaces:**
- Consumes: `/api/me`, `PATCH /api/me/profile`, `PATCH /api/household` (send a fresh `Idempotency-Key` = `uuidv7()` per save attempt, reused on retry), Better Auth client `changePassword`, `twoFactor.enable/disable/generateBackupCodes`, `revokeSessions`, `signOut`.

- [ ] **Step 1: Write failing component tests** — Profile: name editable, email shown read-only with the hint "Changing your email needs email delivery, which isn't set up yet."; Household: rename saves and shows the new name, a `member` role sees it read-only; TwoFactor: enabling asks for the password, shows a QR code (render `totpURI` with a QR component — `qrcode.react` dep) and the secret as text, asks for a code, then shows backup codes once with "I've saved these"; Sessions: "Sign out everywhere" confirms with `ConfirmDialog`, then lands on `/sign-in`.
- [ ] **Step 2: Run** — expect FAIL. **Step 3: Implement** with `FormSection`/`SectionForm`/`PendingChangesBar`; ⓘ text for settings covers each section. **Step 4: Run** — expect PASS.
- [ ] **Step 5: e2e harness** — `apps/api/scripts/e2e-database.ts create|drop <name>` using `createTestDatabase`-style create + migrate; Playwright `globalSetup` creates the DB, starts `pnpm --filter @nexus/api start` with `DATABASE_URL` = that DB, `PORT=3100`, `WEB_DIST_DIR`, `BETTER_AUTH_URL=http://127.0.0.1:3100`, `SIGNUP_ALLOWED_EMAILS=owner@nexus.test`, a fixed test `BETTER_AUTH_SECRET`; waits for `/`; `globalTeardown` stops it and drops the DB. Remove the `webServer` block. CI uses the same path against its Postgres service.
- [ ] **Step 6: e2e flow** (`desktop` and `mobile` projects): create account `owner@nexus.test` → lands on Home (heading "Home", ⓘ opens text) → Settings → rename household → reload shows new name → enable 2FA (compute the code with `otpauth` from the shown secret) → sign out → sign in with password → code step → Home. Also: an unlisted email gets "This account can't be created." Run `pnpm build && pnpm e2e` — expect PASS on both projects.
- [ ] **Step 7: Docs** — `docs/features/accounts/settings.md`; `docs/reference/ui-flows.md` (sign-in → 2FA → shell); `docs/guides/local-development.md` (e2e now creates its own DB); CHANGELOG line.
- [ ] **Step 8: Final verification** — `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e`; `pnpm dev`, sign up with the allowlisted email in a real browser at desktop and 375px, enable 2FA with a phone authenticator, sign in again. Then `graphify update .` if the graph exists.
- [ ] **Step 9: Commit** `feat(web): settings page and signed-in end-to-end flow`
