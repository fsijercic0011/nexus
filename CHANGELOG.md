# Changelog

## 2026-10-31

- Recorded project setup decisions (ADRs 0001–0008), the roadmap, and the
  project `CLAUDE.md`.
- Dropped Docker for local development in favor of a hosted dev database
  (ADR 0009).
- Linked the Neon dev project; standardized on PostgreSQL 18 (ADR 0010).
- Scaffolded the pnpm monorepo: shared health contract, Fastify API with
  `GET /api/health`, Drizzle migrations and isolated test schemas on Neon.
- Added the React web app (health status), SPA serving from the API, a
  Playwright smoke test and GitHub Actions CI.
