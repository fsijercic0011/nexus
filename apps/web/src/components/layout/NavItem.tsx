import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NavIconTile } from "./NavIconTile";
import { isCurrentNavEntry, type NavEntry } from "./nav-config";

/** A sidebar row: flat, with a left accent edge on the current page. */
export function NavItem({ entry }: { entry: NavEntry }) {
  const { pathname } = useLocation();
  const current = isCurrentNavEntry(pathname, entry);
  return (
    <Link
      to={entry.path}
      aria-current={current ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 border-l-[3px] border-transparent px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        current
          ? "border-ring bg-accent text-accent-foreground"
          : "text-foreground hover:bg-secondary",
      )}
    >
      <NavIconTile entry={entry} active={current} />
      <span>{entry.label}</span>
    </Link>
  );
}
