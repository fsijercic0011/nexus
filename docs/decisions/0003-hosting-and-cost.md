# 0003 — Hosting and running cost

> The "MinIO locally" note is superseded by 0009.

## Context

NEXUS is used mainly by its developer and possibly a few friends. Running cost
should be as low as possible.

## Decision

- **Railway** hosts the API and PostgreSQL. The API serves the built SPA
  statically with SPA fallback, so production is one deployment.
- **Cloudflare R2** stores files (photos, receipts, documents), accessed through
  signed, time-limited URLs. MinIO replaces it locally.
- **Cost is a design constraint.** Prefer free tiers, self-hosted libraries and
  on-device processing over paid APIs. Any feature with recurring per-use cost
  (email, AI, catalog APIs) needs an explicit decision before it is added.
- Household invitations in the MVP are **shareable invite links**; email
  delivery is added later (provider chosen then, free tier preferred).

## Consequences

- No email provider is needed for the MVP.
- Paid AI features are deferred (see `docs/roadmap/README.md`).
