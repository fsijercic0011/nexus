import { Link } from "react-router-dom";

/** The sidebar's top: the NEXUS wordmark (plain text until branding exists). */
export function SidebarHeader() {
  return (
    <div className="flex h-sidebar-header shrink-0 items-center border-b border-border px-5">
      <Link
        to="/"
        className="text-sm font-bold tracking-[0.16em] text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        NEXUS
      </Link>
    </div>
  );
}
