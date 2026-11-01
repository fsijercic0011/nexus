# Accounts, household and app shell — design

Date: 2026-11-01. Status: draft for approval.

## Intent

NEXUS is, for now, a personal tool: one person (the owner) signs in from
desktop and phone and manages one household. Sharing with friends is a real
future wish (friends as read-only guests who can see, e.g., whether there are
snacks), but not now.

This slice delivers everything a real feature (inventory, next) needs to sit
on: a hardened sign-in, the household tenancy boundary, the history pattern,
and an app shell built from a shared component kit — so the first domain
feature is "just a feature".

## Goals

1. **Shared UI kit**, ported from `../ImperiorProject` and de-branded, in the
   Graphite-dark look (below), documented in `docs/reference/design-system.md`.
2. **Sign-in** with Better Auth: email + password and Google; **TOTP 2FA**
   optional, set up in settings, with backup codes.
3. **Closed sign-up:** only emails on a server-side allowlist can create an
   account. Today that is the owner's email only.
4. **Household on first sign-in:** the first time a user signs in, a household
   is created and they become its `admin`.
5. **Tenancy and authorization groundwork** per ADR 0004, even with one user:
   every household-owned row carries `household_id`; every request resolves the
   acting member and role; tests prove cross-household access is refused.
6. **Entity registry + event history** per ADR 0005: the `entities` table, an
   `events` table, and one helper that writes state + event in one transaction.
   Built and tested here; first real use is inventory.
7. **App shell:** desktop sidebar, phone bottom tab bar, a placeholder Home
   page, a Settings page, and the ⓘ page-info pattern on every page.

## Non-goals (this slice)

- Invite links, member management, guests, household switching → roadmap
  entry "Sharing with friends". Needs a new ADR, since ADR 0008 put invites and
  roles in v0.1.
- "Am I home" presence — later; a manual switch is a candidate idea.
- Any domain feature (inventory, kitchen, shopping, tasks).
- Light theme, branding/logo, translations.
- Account deletion and household JSON export (ADR 0007) — next to sharing, not
  needed while the only data is the owner's account.
- Email delivery (password reset by email) — roadmap v0.2. Until then a
  forgotten password is reset with a server-side CLI command
  (`pnpm --filter @nexus/api reset-password <email>`), and Google sign-in is
  the everyday fallback. *(Design call, not discussed.)*

## Anti-goals

- Anyone on the internet being able to create an account.
- Imperior showing through: no copper/gold, valley photo, FLOW gradient,
  agency-specific components or i18n plumbing.
- Page-local styling or forked components — the kit is the only source of UI.
- Shortcuts that make sharing expensive later (single-user assumptions in the
  schema or in query helpers).

## Constraints

- Everything in the project `CLAUDE.md` and ADRs 0001–0011 applies: pnpm
  monorepo, Fastify + Drizzle + Postgres 18, Better Auth, Biome, Vitest,
  Playwright, UUIDv7, idempotency keys on writes, migrations generated and
  applied explicitly, integration tests on a throwaway database (ADR 0011).
- Running cost stays zero: Better Auth is self-hosted in the API; Google OAuth
  is free.
- Online only.

## Decided

### Look: Graphite dark

Chosen from three mockups (`.superpowers/brainstorm/…/visual-style.html`).
Imperior's quiet workspace with the warmth removed: cool near-black/grey
surfaces, neutral hairline borders, one calm blue accent for selection, focus
and links; amber for "low"/attention, using the status-colour rule from
Imperior's design-system doc (green live/done, amber needs attention, red
stopped/not allowed, grey inactive). Primary button is light-on-dark (as in
Imperior). Dark only. "NEXUS" is a plain text wordmark until branding exists.
Reference palette from the mockup (become tokens, not literals):
background `#121417`, sidebar `#181b1f`, card `#1a1d21`, border `#262a30`,
text `#e6e8eb`, muted text `#9aa1a9`, accent `#8cc4ff` on `#23303d`,
warning `#f0b45a`.

### UI kit port (first step of the slice)

Source: `../ImperiorProject/frontend/src/components/{ui,layout}`,
`frontend/src/hooks`, relevant `frontend/src/lib` helpers and
`frontend/src/index.css`. Copied in (not imported) to `apps/web`.

- **Bring:** button, input, label, textarea, select, switch, segmented, tabs,
  badge, card, menu, form-field, form-section, section-form,
  pending-changes-bar, responsive-dialog, bottom-sheet, confirm-dialog,
  unsaved-changes-dialog, page-header, page-info, page-utilities, empty-state,
  loading-state, error-state, error-boundary, data-table, table, table-cards,
  surface-list, filter-bar, filter-search, filter-select, search-input,
  multi-select, searchable-select, toggle-chip, sonner; layout shell
  (AppLayout, Sidebar, SidebarHeader, BottomNav, NavItem, NavGroup,
  NavIconTile, NavBadge, ShellContext, Toolbar, nav-config, ProfileChip);
  hooks useIsMobile, useStoredState, useDebouncedValue; lib utils (`cn`),
  api-client, stored-state, page-info; their tests.
- **Leave:** brand (ImperiorLockup, mark), AppBackdrop, ImpersonationBanner,
  platform, sale-type, timezone-select, booking-calendar, calendar-toolbar,
  document-top-bar, identity-header, date pickers (bring later when a feature
  needs dates), LanguageToggle, RoleSelect, everything domain-specific.
- **Transform:** strip i18n (plain English strings); replace Imperior tokens
  with the Graphite tokens; drop ADR references to Imperior's ADRs; format with
  Biome; satisfy NEXUS's TypeScript settings; keep the component tests passing.
  New deps as needed (`@base-ui/react`, `class-variance-authority`, `clsx`,
  `tailwind-merge`, `lucide-react`, `sonner`, `@tanstack/react-table`,
  `react-router-dom`, `tw-animate-css`).
- **Docs:** `docs/reference/design-system.md` (adapted from Imperior's
  design-system and responsive-layout docs, NEXUS terms only) and an ADR
  recording that the kit is derived from Imperior and why.

### Sign-in and sign-up

- Better Auth mounted in the API under `/api/auth/*`, Drizzle adapter, its
  tables in the NEXUS schema/migrations.
- Methods: email + password; Google OAuth.
- **Allowlist:** env var (e.g. `SIGNUP_ALLOWED_EMAILS`, comma-separated,
  case-insensitive). Account creation by either method is refused for any
  other email, server-side. Sign-in page shows a neutral "This account can't
  be created" message. `.env.example` gets the key, blank.
- **2FA:** TOTP via Better Auth's two-factor plugin, optional, enabled from
  Settings: QR code + manual secret, confirm with a code, show backup codes
  once. When enabled, a **password** sign-in asks for a code (or backup code).
  **Google sign-ins rely on Google's own 2FA** and are not challenged by
  NEXUS (owner's decision) — recorded in an ADR, since ADR 0007 reads as
  "2FA for every user".
- **Google OAuth credentials and the production URL don't exist yet.** This
  slice builds Google sign-in against config (`GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_URL`, blank in `.env.example`); the
  Google button is hidden when the client ID is unset. Tests mock the OAuth
  callback. A guide `docs/guides/google-oauth-setup.md` explains creating the
  Google Cloud client and redirect URIs (dev and Railway) for when NEXUS is
  deployed; real Google verification happens then.
- Sessions: Better Auth cookie sessions (HttpOnly, Secure in production,
  SameSite=Lax). "Sign out everywhere" in Settings.
- **Client address:** port Imperior's `plugins/client-address.ts` (trust
  Railway's `X-Real-IP` only on Railway) and feed it to Better Auth's rate
  limiting.

### Household and tenancy

- Tables per ADR 0004: `households`, `household_members` (user, household,
  role `admin|member|guest`), `properties` (schema only; no UI).
- First successful sign-in with no membership → create household (default
  name, e.g. "My household", editable later) and an `admin` membership, in one
  transaction, idempotent if two first requests race.
- An API request context resolves: user → active household → member + role.
  With one household per user, "active" is the only one; the helper takes the
  household explicitly so switching can be added later without changing call
  sites.
- Authorization helpers enforce role and `shared`/`private` visibility; a
  query helper without household scope is a bug (ADR 0004 consequence).
- Membership/role changes write `audit_logs` (ADR 0007) — the household
  creation's admin membership is the first such entry.
- *(Design call)* The household is created lazily on the first authenticated
  request that finds no membership, guarded by a unique constraint so a race
  creates one household; not in a Better Auth hook.
- *(Design call)* The allowlist gates **account creation only**. Removing an
  email later does not lock out an existing account (revisit with sharing).

### Visibility and ownership *(design call)*

- `visibility` (`shared|private`) and `owner_member_id` live on each **domain
  table** that has private records, via a shared Drizzle column helper — not
  on `entities`, which stays thin (ADR 0005).
- Enforcement is a reusable query fragment (`visibleTo(member)`) that every
  domain query composes, plus a write guard; both tested here against a
  test-only domain table, first real use in inventory.

### Audit log *(design call)*

`audit_logs`: `id`, `household_id` (nullable for account-level events),
`actor_user_id`, `action` (e.g. `member.added`, `2fa.enabled`),
`target_entity_type`, `target_id`, `before`/`after` JSONB, `client_ip`,
`user_agent`, `occurred_at`. Written in the same transaction as the change.
This slice audits: membership/role changes, household rename, password
change, 2FA enabled/disabled, sign-out-everywhere. Sign-in history (every
login attempt) is not in this slice.

### Idempotency *(design call)*

This slice builds the shared mechanism so every later endpoint reuses it:
an `Idempotency-Key` header on NEXUS write endpoints (not Better Auth's own),
an `idempotency_keys` table (key, user, route, request hash, stored status +
body, created_at; replay returns the stored response, same key with a
different body → 422), pruned after 24 hours by a pg-boss job or on write.
Used here by the household-name and profile-name writes.

### Entities and events

- `entities` (`id` UUIDv7, `household_id`, `entity_type`, timestamps) and
  `events` (entity, event type, actor or integration source, `occurred_at`,
  `recorded_at`, validated payload, correlation key, idempotency key) per
  ADR 0005.
- One helper that, inside a transaction, inserts the `entities` row (on
  create), inserts/updates the domain row and inserts the event; tested with a
  test-only domain table.

### Screens

- **Sign-in:** email/password, "Continue with Google", 2FA code step.
- **Shell:** desktop sidebar; phone bottom tab bar. Nav entries appear only for
  pages that exist (Home, Settings now). The central scan/quick-add button
  stays hidden until scanning ships.
- **Home:** an empty state ("Nothing here yet — inventory is coming"); becomes
  the overview later.
- **Settings:** name, email (read-only — changing it needs email
  verification, which waits for email delivery; *design call*), change
  password, 2FA on/off + backup codes,
  sign out everywhere, household name.
- Every page has its ⓘ text.

## Left to the builder

- Exact Better Auth configuration and plugin wiring; how the allowlist hook is
  implemented (before-create hook vs. custom endpoint guard).
- Final token names and the full scale (the mockup values are the starting
  point; contrast must stay readable).
- Routing structure (`react-router-dom` like Imperior unless something
  simpler fits).
- How the event payload is validated (Zod schema per event type in
  `packages/shared` is the expected default).
- Test split: unit for helpers and components, integration for auth, tenancy
  and the event helper, one Playwright flow (sign in → shell → settings).

## Acceptance criteria

1. An allowlisted email can sign up and sign in with email + password, and
   with Google (mocked OAuth callback); any other email is refused by the API
   for both methods (tested).
2. A new user gets exactly one household and an `admin` membership, even under
   concurrent first requests (tested).
3. A request for another household's data returns 403/404 (tested).
4. TOTP can be enabled, is required at the next password sign-in, and backup
   codes work once each (tested).
5. The state + event helper commits both or neither (tested).
6. The shell works at 375px and desktop: bottom bar on phone, sidebar on
   desktop; Home and Settings reachable; ⓘ on each page.
7. No Imperior branding, colours or i18n remain; no hex values in components;
   `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` pass.
8. Docs updated: design-system reference, ADRs (UI kit origin; invites moved
   out of v0.1; 2FA not applied to Google sign-ins), Google OAuth guide, roadmap ("Sharing with friends"), feature docs, CHANGELOG.
