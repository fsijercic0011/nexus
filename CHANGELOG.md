# Changelog

## 2026-11-01

- Ported the shared UI primitives from Imperior with the Graphite dark theme
  (ADR 0012).
- Ported the composite components (dialogs, forms, tables, filters, page
  header with ⓘ) and documented the design system.
- Added the app shell: sidebar on desktop, bottom tab bar on phones, Home
  and Settings pages; e2e runs on desktop and phone viewports.

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
- Integration tests use a throwaway database per test (ADR 0011); malformed
  database URLs and a missing web build now fail startup with a named variable.
