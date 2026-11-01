import type { ShellUser } from "./AppLayout";
import { NavItem } from "./NavItem";
import { NAV_ENTRIES } from "./nav-config";
import { ProfileChip } from "./ProfileChip";
import { SidebarHeader } from "./SidebarHeader";

/** The desktop sidebar. Phones use the bottom bar instead. */
export function Sidebar({ user }: { user?: ShellUser }) {
  return (
    <aside className="sticky top-0 flex h-dvh w-sidebar shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar">
      <SidebarHeader />
      <nav
        aria-label="Main"
        className="no-scrollbar flex-1 overflow-y-auto pt-4 pb-2"
      >
        {NAV_ENTRIES.map((entry) => (
          <NavItem key={entry.id} entry={entry} />
        ))}
      </nav>
      {user && (
        <div className="shrink-0 border-t border-border p-2">
          <ProfileChip name={user.name} email={user.email} />
        </div>
      )}
    </aside>
  );
}
