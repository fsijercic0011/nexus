import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NavIconTile } from "./NavIconTile";
import { NAV_ENTRIES } from "./nav-config";

/** The phone bottom bar: one tab per page. The central scan / quick-add
 * button joins it when scanning ships. */
export function BottomNav() {
  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-sidebar pb-[env(safe-area-inset-bottom)]"
    >
      {NAV_ENTRIES.map((entry) => (
        <NavLink
          key={entry.id}
          to={entry.path}
          end={entry.end}
          className={({ isActive }) =>
            cn(
              "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-1 text-caption font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring",
              isActive ? "text-accent-foreground" : "text-muted-foreground",
            )
          }
        >
          {({ isActive }) => (
            <>
              <NavIconTile entry={entry} active={isActive} />
              <span>{entry.shortLabel ?? entry.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
