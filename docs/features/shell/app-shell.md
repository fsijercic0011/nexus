# App shell

The frame every signed-in page sits in. Code: `apps/web/src/components/layout`.

## What it shows

- **Desktop (768px and wider):** a sidebar on the left with the NEXUS
  wordmark, one row per page, and the signed-in person at the bottom (opens
  Settings). The current page's row has a blue edge and tint.
- **Phone (below 768px):** a bottom tab bar with one tab per page, fixed to
  the bottom and clear of the home indicator. No sidebar. The central scan /
  quick-add button joins the bar when scanning ships.
- **Pages:** Home (an empty state until inventory exists) and Settings.
  Navigation entries are listed in `nav-config.ts` and appear only once
  their page exists.
- A "Skip to content" link is the first focusable element.

## Page info (ⓘ)

Every page opens with `PageHeader`, which carries the page's ⓘ. It opens a
dialog (a bottom sheet on phones) with the page's explanation from
`apps/web/src/lib/page-info.ts`. A change to a page's behaviour updates its
entry in the same change.

## Tests

- `components/layout/AppLayout.test.tsx` — sidebar on desktop, bottom bar on
  phones, no scan button yet.
- `components/layout/ProfileChip.test.tsx` — long names truncate.
- `apps/web/e2e/smoke.spec.ts` — runs on a desktop and a phone (Pixel 7)
  viewport.
