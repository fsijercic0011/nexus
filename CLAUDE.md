# NEXUS

A cloud-hosted platform for managing a household and the personal environment
within it: inventory and kitchen, wardrobe, activities and tasks, finances,
connected devices, and a knowledge base of household documents — built on one
shared data model rather than separate apps. Used mainly by one person on
desktop and phone, possibly shared with a few friends' households.

The product concept, domain model and long-term roadmap are in
`docs/NEXUS_Product_Architecture_and_Initial_Specification.md` ("the spec").
Decisions that refine or override the spec are ADRs in `docs/decisions/` —
when they disagree, the ADR wins. What is deferred is in
`docs/roadmap/README.md`. The v0.1 scope is ADR 0008.

## Product principles that shape code

From spec §2 — apply them when designing anything:

- **One source of truth.** One authoritative record per item, device, task or
  transaction. Insights, dashboards and automations read domain data; they
  never keep their own copy.
- **Current state + history.** Update current state and insert the matching
  event in the **same database transaction** (ADR 0005).
- **Manual first.** Every workflow works without sensors, integrations or AI.
- **Proposals, not silent mutations.** Scanning, AI and external catalogs
  propose a change; the user confirms it. External data is untrusted input —
  validate it and store its provenance.
- **Explicit, relational domains.** Typed tables per domain plus a thin
  `entities` registry; JSONB only for genuinely variable metadata (ADR 0005).
- **Tenancy everywhere.** Every household-owned row carries `household_id`;
  authorization (roles `admin`/`member`/`guest`, visibility
  `shared`/`private`) is enforced in the backend and covered by tests
  (ADR 0004).
- **Explicit units, money and time.** Quantities carry a unit; money is integer
  minor units + currency code; timestamps are UTC (ADR 0006).
- **Minimal running cost.** Prefer free tiers, self-hosted libraries and
  on-device processing. Anything with a recurring per-use cost needs an ADR
  first (ADR 0003).

## Architecture

A **modular monolith** in a pnpm workspaces monorepo (ADR 0001, 0002):

- `apps/web` — React + TypeScript + Vite SPA and installable PWA. Tailwind
  with headless primitives and NEXUS's own components (not shadcn/ui as the
  look). TanStack Query for server state.
- `apps/api` — Fastify + TypeScript (ESM). Domain modules under
  `src/modules/`; integrations, events and automation separated as in spec §12.
  Serves the built SPA in production. WebSockets for realtime, fanned out via
  Postgres `LISTEN/NOTIFY`. Background jobs on pg-boss.
- `packages/shared` — Zod schemas and types shared by web and API.
- **Postgres** via Drizzle ORM. Auth via Better Auth (email + password, Google,
  TOTP 2FA).
- **Files** in Cloudflare R2 (MinIO locally), served only via signed,
  time-limited URLs.
- **Hosting:** Railway (API + Postgres), one deployment (ADR 0003).

Add a new app or package (e.g. `apps/home-bridge`) only when a feature needs
it. Don't add Redis, queues or separate services without an ADR.

## Documentation discipline

Docs are split by purpose, not topic. Create a folder when its first doc is
written:

- `docs/reference/` — how it works now (schema, API shape, UI flows,
  `design-system.md`)
- `docs/guides/` — how to do X
- `docs/architecture/` — the big picture
- `docs/decisions/` — ADRs, `NNNN-short-title.md`
- `docs/roadmap/` — planned, not built
- `docs/features/<area>/` — one living doc per feature
- `docs/integrations/` — one doc per outside service
- `CHANGELOG.md` — dated one-line entries

Update docs in the same turn as the change, not as an afterthought:

- **Changed behavior, fixed a bug, shipped a feature** → one line in
  `CHANGELOG.md` under today's date. Always.
- **Changed something a reference doc describes** → update it in place,
  present tense, no dates, no "new"/"updated" markers.
- **Made a real trade-off** (chose X over Y for a reason not obvious from the
  code, or deviated from the spec) → new ADR: context, alternatives, decision,
  consequences. Never edit an existing ADR's decision — supersede it.
- **Built or changed a feature** → its living doc in `docs/features/<area>/`.
- **Added or changed an integration** → its doc in `docs/integrations/`.
- **Shipped something tracked in `docs/roadmap/`** → move it out.
- **Never** put dated notes ("Update 2026-…", "Resolved", strikethroughs) in
  reference, feature or integration docs — that belongs in `CHANGELOG.md` or an
  ADR.

Filenames in `docs/` are kebab-case. The spec document keeps its original name.

## Feature workflow

Every feature goes **spec → plan → build → verify → docs**:

1. **Spec** — what it does, for whom, acceptance criteria; check the spec and
   relevant ADRs.
2. **Plan** — schema, API, UI and tests touched.
3. **Build** — on a feature branch.
4. **Verify** — tests pass and the flow works in the running app.
5. **Docs** — per the rules above, then PR into `main`.

## UI conventions

- **Reuse before you build.** Before building a UI element, check the shared
  components (catalog in `docs/reference/design-system.md`) and an existing page
  doing the same thing; use or extend the shared component. Never fork a
  page-local table, search field, filter row or dialog.
- **One unified look** defined by theme tokens; no hex values or page-level
  styling in components. No branding exists yet. The user will supply
  components from previous projects — adapt them into the shared set rather
  than reinventing.
- **Phone and desktop are equally first-class.** Phone: bottom tab bar with a
  central scan/quick-add button. Desktop: sidebar. Mobile prioritizes quick
  actions (scan, add/consume, complete task), not a shrunken desktop.
- **Every page has an ⓘ info button** that explains the page; update its text
  whenever the page's behavior changes.
- UI language is English only.

## Working conventions

- Code, identifiers, comments, commit messages and docs are in English.
- **Git:** a branch per feature, PR into `main`. Commit on your own after each
  verified step — don't wait to be asked. Remote: GitHub.
- Secrets live in `.env` (gitignored). Commit only `.env.example` with blank
  values. Never put credentials in docs, commits or Claude settings.
- Schema changes are a Drizzle-generated migration, reviewed before commit,
  append-only, applied by an explicit command — never at startup.
- Write endpoints accept idempotency keys; IDs are UUIDv7.
- Verify every change with lint, typecheck and tests (Biome, `tsc`, Vitest;
  Playwright for critical flows) and by running the app. Exact commands are
  listed here once the repo is scaffolded.

## graphify

Once the project has code and a knowledge graph at `graphify-out/`:

- When `graphify-out/graph.json` exists, run `graphify query "<question>"`
  before the first grep, search or source-file read for a codebase question,
  and put this rule in every subagent prompt that explores code. Read raw files
  only for lines the graph or an earlier read already located. Use
  `graphify path "<A>" "<B>"` for relationships and
  `graphify explain "<concept>"` for focused concepts.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review.
- After modifying code, run `graphify update .`.
- A committed `graphify-out/graph.json` is rewritten whole on every build; a
  large diff to it is expected — don't flag it as churn.
