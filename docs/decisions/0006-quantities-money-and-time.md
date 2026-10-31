# 0006 — Quantities, money and time

## Decision

- **Quantities** are decimals with an explicit unit. Supported units: metric
  mass and volume (g, kg, ml, l) and count units (pcs, packs, …). A product can
  define package-size conversions (e.g. 1 pack = 6 pcs). Imperial units are not
  supported.
- **Money** is multi-currency from the start: amounts are stored as integer
  minor units together with an ISO 4217 currency code. Never a float, never an
  amount without its currency.
- **Time:** timestamps are stored in UTC (`timestamptz`). Each household has a
  time zone and locale setting; the default is `Europe/Sarajevo`, dates as
  `dd.mm.yyyy`, 24-hour clock, week starting Monday.
- **UI language** is English only.

## Consequences

- Currency conversion and aggregated totals across currencies are a later
  finance-phase decision.
- Date formatting always goes through one formatter that reads the household
  settings.
