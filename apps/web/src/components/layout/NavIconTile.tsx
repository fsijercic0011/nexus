import { type NavEntry, navEntryColor } from "./nav-config";

/** The page's glyph in its tone over a soft tint of it; the tint deepens on
 * the current page. */
export function NavIconTile({
  entry,
  active = false,
}: {
  entry: NavEntry;
  active?: boolean;
}) {
  const color = navEntryColor(entry);
  return (
    <span
      className="relative inline-flex size-6 shrink-0 items-center justify-center rounded-md"
      style={{
        color,
        backgroundColor: `color-mix(in oklab, ${color} ${active ? 26 : 16}%, transparent)`,
      }}
    >
      <entry.icon className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
    </span>
  );
}
