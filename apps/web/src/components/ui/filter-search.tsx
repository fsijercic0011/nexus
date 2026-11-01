import type { LucideIcon } from "lucide-react";
import { type CSSProperties, isValidElement, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import { cn } from "@/lib/utils";

// The one look of a list page's filter row (Audit log's): a bordered search
// with a magnifier, then compact bordered controls led by an icon in one of
// the sidebar's color families. No visible labels -- the icon and the
// selected value say what a control filters; labels stay for screen readers.

/** The sidebar color families a filter icon can take (`--nav-<tone>-2`). */
export type FilterTone =
  | "blue"
  | "cyan"
  | "pink"
  | "violet"
  | "emerald"
  | "orange"
  | "lime"
  | "slate";

export function FilterSearch({
  id,
  label,
  placeholder,
  value,
  onChange,
  maxLength = 200,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}) {
  return (
    <div>
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <SearchInput
        id={id}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

/** The colored icon that leads a filter control. */
export function FilterIcon({
  icon: Icon,
  tone = "blue",
  className,
}: {
  icon: LucideIcon;
  tone?: FilterTone;
  className?: string;
}) {
  return (
    <Icon
      aria-hidden="true"
      className={cn("size-4 shrink-0", className)}
      style={{ color: `var(--nav-${tone}-2)` }}
    />
  );
}

/** Whether a filter control is narrowing the list: its control's `value` is
 * set and not "all". Pass `active` when the default is something else. */
function narrowing(children: ReactNode): boolean {
  const value = isValidElement<{ value?: unknown }>(children)
    ? children.props.value
    : undefined;
  return typeof value === "string" && value !== "" && value !== "all";
}

/** A compact control in the filter row: fixed width on desktop, full width in
 * the phone sheet, an optional colored icon laid over the control's left edge.
 * Searchable pickers and date pickers (outline buttons) are evened out to the
 * select look. While it narrows the list it glows in its icon's colour
 * (`data-filter-active`, index.css), never gold. */
export function FilterField({
  id,
  label,
  icon,
  tone,
  wide = false,
  active,
  children,
}: {
  id: string;
  label: string;
  icon?: LucideIcon;
  tone?: FilterTone;
  wide?: boolean;
  active?: boolean;
  children: ReactNode;
}) {
  const on = active ?? narrowing(children);
  return (
    <div
      data-filter-active={on || undefined}
      style={
        { "--filter-tone": `var(--nav-${tone ?? "slate"}-2)` } as CSSProperties
      }
      className={cn(
        "relative min-w-0",
        !wide && "md:w-48 md:shrink-0",
        "[&_[data-slot=input]]:h-10 [&_[data-slot=input]]:rounded-md [&_[data-slot=input]]:bg-card",
        "[&>[data-slot=button]]:h-10 [&>[data-slot=button]]:rounded-md [&>[data-slot=button]]:border-input [&>[data-slot=button]]:bg-card [&>[data-slot=button]]:text-foreground",
        icon &&
          "[&_[data-slot=select-trigger]]:pl-9 [&_[data-slot=input]]:pl-9 [&>[data-slot=button]]:pl-9",
      )}
    >
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      {icon && (
        <FilterIcon
          icon={icon}
          tone={tone}
          className="pointer-events-none absolute top-5 left-3 z-10 -translate-y-1/2"
        />
      )}
      {children}
    </div>
  );
}

/** The trigger look compact filter selects share. */
export const FILTER_SELECT_TRIGGER =
  "rounded-md bg-card px-3 data-[size=default]:h-10";

/** A filter control shown in both places, with the same icon-led look: a
 * fixed width in the filter row, the full width of the entity panel's
 * settings view. */
export function FilterControl({
  compact,
  id,
  label,
  icon,
  tone,
  active,
  children,
}: {
  compact: boolean;
  id: string;
  label: string;
  icon?: LucideIcon;
  tone?: FilterTone;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <FilterField
      id={id}
      label={label}
      icon={icon}
      tone={tone}
      wide={!compact}
      active={active}
    >
      {children}
    </FilterField>
  );
}
