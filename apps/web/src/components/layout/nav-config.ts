import { House, type LucideIcon, Settings } from "lucide-react";
import type { PageId } from "@/lib/page-info";

/** An icon tone family; styles/theme.css defines --nav-<family>-1..4. */
export type NavFamily =
  | "blue"
  | "cyan"
  | "violet"
  | "emerald"
  | "orange"
  | "slate";

export type NavEntry = {
  id: PageId;
  path: string;
  icon: LucideIcon;
  label: string;
  /** Shorter label for the phone bottom bar. */
  shortLabel?: string;
  family: NavFamily;
  /** Match the path exactly (otherwise any sub-path counts as this entry). */
  end?: boolean;
};

/** Pages in the sidebar and the bottom bar, in order. An entry is added only
 * when its page exists. */
export const NAV_ENTRIES: NavEntry[] = [
  {
    id: "home",
    path: "/",
    icon: House,
    label: "Home",
    family: "blue",
    end: true,
  },
  {
    id: "settings",
    path: "/settings",
    icon: Settings,
    label: "Settings",
    family: "slate",
  },
];

export function isCurrentNavEntry(pathname: string, entry: NavEntry): boolean {
  if (entry.end) return pathname === entry.path;
  return pathname === entry.path || pathname.startsWith(`${entry.path}/`);
}

export function navEntryColor(entry: NavEntry): string {
  return `var(--nav-${entry.family}-2)`;
}
