import { ArrowUpRight } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useRef } from "react";
import { Link } from "react-router-dom";
import { nextTabIndex } from "@/lib/tabs";
import { cn } from "@/lib/utils";

const TAB_CLASS =
  "shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring";

/** Accessible tablist (roving tabindex, arrow/Home/End keys). Scrolls
 * horizontally when the tabs overflow a phone. Pair with TabPanel.
 * `trailing` sits after the tabs in the same bar, outside the tablist --
 * for TabLink entries that go to another page. */
export function Tabs<T extends string>({
  value,
  onValueChange,
  items,
  label,
  idPrefix,
  trailing,
}: {
  value: T;
  onValueChange: (value: T) => void;
  items: { id: T; label: string }[];
  label: string;
  idPrefix: string;
  trailing?: ReactNode;
}) {
  // An unknown value falls back to the first tab so the tablist stays reachable.
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === value),
  );
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const next = nextTabIndex(activeIndex, event.key, items.length);
    if (next === null) return;
    event.preventDefault();
    const target = items[next];
    if (!target) return;
    onValueChange(target.id);
    refs.current[next]?.focus();
  }
  return (
    <div className="flex gap-1 overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_var(--color-border)]">
      <div role="tablist" aria-label={label} className="flex gap-1">
        {items.map((item, index) => (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${item.id}`}
            aria-controls={`${idPrefix}-panel-${item.id}`}
            aria-selected={value === item.id}
            tabIndex={index === activeIndex ? 0 : -1}
            onClick={() => onValueChange(item.id)}
            onKeyDown={onKeyDown}
            className={cn(
              TAB_CLASS,
              value === item.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {trailing}
    </div>
  );
}

/** A tab-styled link to another page (e.g. a person's other side), with an
 * arrow so it reads as "goes somewhere" rather than "switches the view". */
export function TabLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className={cn(
        TAB_CLASS,
        "inline-flex items-center gap-1 border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      <ArrowUpRight aria-hidden="true" className="size-3.5" />
    </Link>
  );
}

export function TabPanel({
  idPrefix,
  id,
  children,
}: {
  idPrefix: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${id}`}
      aria-labelledby={`${idPrefix}-tab-${id}`}
    >
      {children}
    </div>
  );
}
