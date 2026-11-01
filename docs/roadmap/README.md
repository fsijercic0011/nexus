# Roadmap

Planned, not built. Phases follow the spec (§14). Move an item out when it
ships.

## v0.2 and after the core MVP

- **Automation engine** — trigger → conditions → actions, with automatic /
  approval / suggestion modes and execution logs. Actions that control a
  device, spend money or delete data require approval.
- **Wardrobe module** — laundry state, availability, outfits, built on
  inventory items.
- **Offline mode** — cached reads and an action outbox that syncs on
  reconnect. Requires the client IDs and idempotency keys from ADR 0005.
- **Printable QR label sheets** — A4 sticker sheets for containers and items
  (no label printer).
- **Email delivery** for invitations and notifications (free-tier provider).
- **Guest invitations** with time-limited access.
- **Passkeys.**
- **Postgres Row-Level Security** as defense in depth.

## Phase 3 — Personal management

- Calendar events, habits and routines, projects.
- Financial records (multi-currency, ADR 0006).
- Cross-domain overview.

## Phase 4 — Connected environment

- Home bridge, MQTT, Home Assistant.
- First hardware: Arduino Uno and ESP32-CAM.
- Telemetry retention window and offline reconciliation for the bridge.

## Phase 5 — Intelligence

- Image-assisted registration, receipt OCR, natural-language queries,
  recommendations.
- Constraint: minimal cost. Prefer on-device or free options (e.g. in-browser
  OCR) first. Sending household data to a cloud LLM needs a separate decision.
