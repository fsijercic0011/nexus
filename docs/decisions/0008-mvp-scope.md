# 0008 — MVP scope

## Context

The spec's v0.1 (§13) is broad. The user cares most about wardrobe, inventory
and kitchen, and wants realtime updates.

## Decision

v0.1 contains:

- Households, invite links, roles and authorization (0004).
- Properties, rooms, locations and nested containers.
- Entity types and categories; products and inventory records — both
  individually tracked assets and quantity-based stock.
- **Clothing is a generic inventory item**; there is no wardrobe module yet.
- Item photos in object storage.
- Barcode scanning (browser `BarcodeDetector` with a ZXing fallback) and NEXUS
  QR codes. Unknown barcodes fall back to manual entry saved as a
  household-local product. Open Food Facts is the first external catalog.
- Quantity, availability and location management; event history and audit.
- Shopping lists, updated in realtime.
- Low-stock notifications and **one fixed rule**: low stock → add to shopping
  list. The general automation engine is v0.2.
- Responsive desktop app and installable PWA. **Online only.**
- Tasks with completion history (needed for acceptance criterion 10).

The interface is web/PWA only; no native app is planned.

Out of v0.1 — see `docs/roadmap/README.md`.

## Consequences

- After the foundation, work is ordered inventory → kitchen → wardrobe.
- The data model keeps client-generated IDs and idempotency keys so that
  offline mode can be added later without a redesign.
