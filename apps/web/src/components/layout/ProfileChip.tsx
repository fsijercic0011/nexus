import { ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

/** The signed-in person at the bottom of the sidebar; opens Settings. Long
 * names and emails truncate; the full text is in the title. */
export function ProfileChip({ name, email }: { name: string; email: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <NavLink
      to="/settings"
      title={`${name} · ${email}`}
      className={({ isActive }) =>
        cn(
          "group flex w-full min-w-0 items-center gap-2.5 rounded-md border-l-2 border-transparent p-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring",
          isActive ? "border-ring bg-accent" : "hover:bg-secondary",
        )
      }
    >
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold"
      >
        {initial}
      </span>
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-sm font-semibold text-foreground">
          {name}
        </span>
        <span className="truncate text-xs text-muted-foreground">{email}</span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      />
    </NavLink>
  );
}
