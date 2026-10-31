# 0007 — Security and data-protection baseline

## Context

NEXUS will store real financial records and personal documents (IDs,
contracts, receipts).

## Decision

- TOTP two-factor authentication is available to every user from the first
  auth release.
- Sensitive and administrative changes (membership, roles, finance records,
  documents, deletions) are written to `audit_logs`.
- Files are private by default and served only through signed, time-limited
  URLs. TLS everywhere; storage and database rely on the provider's encryption
  at rest.
- Integration credentials never reach the frontend.
- Managed daily database backups, with a documented restore procedure.
- Each household can export its data as JSON. Deleting an account hard-deletes
  that user's data.

## Consequences

- Per-field encryption of individual documents is not in the MVP; revisit when
  the knowledge/document module is built.
