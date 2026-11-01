# 0001 — Monorepo and tooling

> Local development (Docker Compose) and the pnpm install method are superseded
> by 0009.

## Context

NEXUS is a single-developer project (with Claude) with a web app, an API and,
later, a home bridge for local devices. The spec (§12) proposes an
`apps/` + `packages/` monorepo; the previous project used a flat
`backend/` + `frontend/` split.

## Decision

- **pnpm workspaces monorepo.** Start with `apps/web`, `apps/api` and
  `packages/shared` only. Add `apps/home-bridge`, `packages/database`,
  `packages/api-client` etc. when a concrete need appears.
- **Node 24** (24.13.1 locally), pinned via `.nvmrc` and `engines`.
- **Biome** for linting and formatting (instead of ESLint + Prettier).
- **Vitest** for unit and integration tests; **Playwright** for a small set of
  critical end-to-end flows.
- **GitHub Actions CI** runs lint, typecheck and tests on every PR.
- **Docker Compose** for local development: Postgres plus MinIO
  (S3-compatible, stands in for Cloudflare R2).
- **Git:** a branch per feature, PR into `main`, remote on GitHub. Claude
  commits on its own after each verified step.

## Alternatives

- npm workspaces — works, but pnpm is faster and stricter about undeclared
  dependencies.
- Native Postgres install or a cloud dev database — rejected in favor of a
  reproducible Compose setup.

## Consequences

- Docker Desktop (with WSL2) must be installed before the API can run locally.
- pnpm is enabled through Corepack (`corepack enable pnpm`).
- Shared types and Zod schemas live in `packages/shared` so web and API agree on
  contracts.
