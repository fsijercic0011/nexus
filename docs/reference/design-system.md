# Design system

NEXUS has one look, Graphite dark, on every page and screen size. Every page
is built from the same page anatomy and the shared components below, so no
page looks different from another. The kit is derived from the owner's
Imperior project ([ADR 0012](../decisions/0012-ui-kit-from-imperior.md)).
Tokens live in `apps/web/src/styles/theme.css`; components live in
`apps/web/src/components/ui` (building blocks) and
`apps/web/src/components/layout` (the shell).

## Page anatomy

Every page inside the app is:

1. **Shell** — the desktop sidebar or the phone bottom bar
   ([app shell](../features/shell/app-shell.md)).
2. **Page header** (`PageHeader`) — the `h1`, an optional one-line
   description, the page's ⓘ (`PageInfoButton`) and page actions on the
   right. A divider separates it from the content on phones; space alone on
   desktop.
3. **Content** — built only from shared pieces: card, data table, form
   section, tabs, empty state, loading state, error state, dialog. Long
   reading text caps at 48rem and form cards at `max-w-4xl`, left-aligned.

No page invents its own header, layout block or surface.

### Page info

Every page passes its `PageId` to `PageHeader`; the ⓘ opens that page's
entry in `apps/web/src/lib/page-info.ts` (title, summary, points). When a
page's behaviour changes, its entry changes in the same commit.

## Look

- **Surfaces are flat.** Cards and containers use the card colour with a
  hairline border; no gradients, glass, blur, hero cards or background
  photos. Floating surfaces (dialogs, sheets, menus, popups) are opaque and
  carry a shadow.
- **Surface utilities**, applied by shared components only, never by a page:
  `surface-card` (table frames, phone table cards, lists, the filter row),
  `surface-interactive` (hover and press tint on a clickable surface) and
  `surface-solid` (floating surfaces).
- **Primary action** is light on dark (`Button` default). **Blue**
  (`accent`, `ring`) marks selection, focus and links — never a status and
  never a button fill.
- **Status colours** follow one rule: green (`success`) is live, done or
  allowed; amber (`warning`) is pending or needs attention (low stock,
  unsaved changes); red (`destructive`) is stopped, failed or not allowed;
  grey (muted) is draft, paused or inactive.
- **Navigation and filter icons** take a tone from the `--nav-<family>-1..4`
  families (`blue`, `cyan`, `violet`, `emerald`, `orange`, `slate`).

## No page-level styling

Colours, radii, shadows and spacing come from theme tokens and shared
components only. A component never contains a hex or `rgb()` value; a page
never sets its own colour or button style. Something the kit doesn't offer
is added to the kit (and to this doc), not to the page.
`apps/web/src/kit-hygiene.test.ts` enforces the colour rule and keeps
Imperior's brand and translation layer out.

## Type sizes

Tailwind's scale (`text-xs` and up) plus two tokens for small print:
`text-caption` (11px — counts, badges, uppercase labels) and `text-micro`
(10px — tiny tags). Both are fixed px. No arbitrary sizes like
`text-[11px]`; a new size becomes a token first and is added to `cn()`'s
tailwind-merge config (`lib/utils.ts`).

## Phone and desktop

Both are first-class; every feature is checked at 375px and on desktop.

- `md` (768px) is the only breakpoint the shell uses. `useIsMobile()`
  reports whether the viewport is below it, for shared components that
  render something different on phones (a sheet instead of a dialog, cards
  instead of a table).
- Phone behaviour lives in shared components, so pages get it for free. A
  separate phone layout for a page is allowed only when the desktop layout
  cannot shrink, and its spec says why.
- Inputs are 16px on phones so iOS doesn't zoom into them.
- Touch targets are at least the default control height (36px).

## Component catalog

### Building blocks (`components/ui`)

| File | Exports | Use it for |
| --- | --- | --- |
| `badge.tsx` | `Badge` | Short labels and statuses, coloured by the status rule. |
| `button.tsx` | `Button`, `buttonVariants` | Every button; variants `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`, `danger`, `success`. |
| `card.tsx` | `Card`, `CardHeader` | The content surface; `pad` sets padding, `dashed` is the empty "add something" slot. |
| `input.tsx` | `Input` | Single-line text fields. |
| `textarea.tsx` | `Textarea` | Multi-line text. |
| `label.tsx` | `Label` | A label for a control (prefer `FormField`). |
| `select.tsx` | `Select*` parts, `SELECT_TRIGGER_CLASS` | A dropdown with a fixed list. |
| `searchable-select.tsx` | `SearchableSelect` | A dropdown with a search box, for long lists. |
| `multi-select.tsx` | `MultiSelect` | Picking several values from a list. |
| `switch.tsx` | `Switch` | On/off settings. |
| `segmented.tsx` | `Segmented` | Choosing one of two to four modes. |
| `toggle-chip.tsx` | `ToggleChip` | A pressable chip that filters or toggles. |
| `tabs.tsx` | `Tabs`, `TabLink`, `TabPanel` | Sections of one page. |
| `menu.tsx` | `Menu`, `MenuItem`, `MenuSeparator`, `MenuRadioGroup` | Overflow and action menus. |
| `sonner.tsx` | `Toaster` | Toast notifications (mounted once in the app). |
| `form-field.tsx` | `FormField`, `FormActions` | A labelled control with hint and error; the save/undo row. |
| `form-section.tsx` | `FormSection` | A titled group of fields inside a form. |
| `section-form.tsx` | `SectionForm` | One record section as a form: Save, Undo, a guard on leaving with unsaved edits. |
| `pending-changes-bar.tsx` | `PendingChangesBar` | A sticky "unsaved changes" bar with Save and Discard. |
| `responsive-dialog.tsx` | `ResponsiveDialog` | A dialog on desktop, a bottom sheet on phones. |
| `bottom-sheet.tsx` | `BottomSheet` | A phone sheet (used by `ResponsiveDialog` and filter rows). |
| `confirm-dialog.tsx` | `ConfirmDialog` | Confirming a destructive or far-reaching action. |
| `unsaved-changes-dialog.tsx` | `UnsavedChangesDialog` | Asking to save or discard before leaving. |
| `page-header.tsx` | `PageHeader` | Every page's title, ⓘ and actions. |
| `page-info.tsx` | `PageInfoButton` | The ⓘ and its explanation dialog. |
| `page-utilities.tsx` | `PageUtilities` | The utilities beside a page heading (the ⓘ today). |
| `empty-state.tsx` | `EmptyState` | A page or section with nothing to show yet. |
| `loading-state.tsx` | `LoadingState` | Waiting for data. |
| `error-state.tsx` | `ErrorState` | Data failed to load, with Try again. |
| `error-boundary.tsx` | `ErrorBoundary` | Catching a render crash and showing `ErrorState`. |
| `table.tsx` | `Table*` parts | Plain table markup (prefer `DataTable`). |
| `data-table.tsx` | `DataTable` | Lists of records: a table on desktop, cards on phones. |
| `table-cards.tsx` | `TableCards`, `splitCardCells`, `columnLabel` | The phone card view behind `DataTable`. |
| `surface-list.tsx` | `SurfaceList` | A standalone list of rows on the card surface. |
| `filter-bar.tsx` | `FilterBar` | The one filter row: search plus filter controls; a sheet on phones. |
| `filter-search.tsx` | `FilterSearch`, `FilterField`, `FilterControl`, `FilterIcon`, `FILTER` | The search and controls inside a `FilterBar`. |
| `filter-select.tsx` | `FilterSelect` | A select inside a `FilterBar`. |
| `search-input.tsx` | `SearchInput` | A search field with a magnifier icon. |

### Hooks and helpers

| File | Exports | Use it for |
| --- | --- | --- |
| `hooks/useIsMobile.ts` | `useIsMobile`, `MOBILE_QUERY` | Rendering something different below `md`. |
| `hooks/useStoredState.ts` | `useStoredState`, `StorageUserContext` | UI state remembered per signed-in user (filters, panels). |
| `hooks/useDebouncedValue.ts` | `useDebouncedValue` | Delaying a value (search as you type). |
| `lib/utils.ts` | `cn` | Merging class names. |
| `lib/stored-state.ts` | storage helpers and validators | Reading and writing remembered state safely. |
| `lib/page-info.ts` | `PAGE_INFO`, `PageId` | The text behind every page's ⓘ. |
