# 0012 — UI kit derived from Imperior

## Context

`CLAUDE.md` asks for one unified look built from shared components, and says
the owner will supply components from previous projects to adapt rather than
reinvent. The owner's Imperior project (`../ImperiorProject`) has a mature
kit: Base UI headless primitives styled with Tailwind theme tokens, a
sidebar / bottom-bar shell, responsive dialogs and sheets, data tables that
become cards on phones, filter rows and the ⓘ page-info pattern. Its look is
Imperior's brand (copper/gold, a background photo, gradient cards) and its
strings go through a translation layer.

## Alternatives

- **Build NEXUS's kit from scratch** — slower, and repeats decisions already
  tested in daily use.
- **shadcn/ui defaults** — `CLAUDE.md` rules out shadcn as the look.
- **A package shared between Imperior and NEXUS** — couples two unrelated
  products and their release cycles.

## Decision

Copy the kit into `apps/web/src/components/{ui,layout}` (plus its hooks and
helpers) and adapt it:

- Graphite dark look (chosen by the owner from three mockups): cool grey
  surfaces, hairline borders, one blue accent for selection and focus. Dark
  only.
- Imperior's brand tokens, background photo, gradients, logo and
  domain-specific components are left behind.
- No translation layer: English strings in place (NEXUS UI is English only).
- Biome formatting and NEXUS's TypeScript settings.

A test (`apps/web/src/kit-hygiene.test.ts`) fails the build if raw colours,
Imperior names, brand tokens or i18n imports reappear outside the theme file.

## Consequences

- The kit is NEXUS's own from here; improvements don't flow back to Imperior
  and vice versa.
- The component catalog lives in `docs/reference/design-system.md`.
