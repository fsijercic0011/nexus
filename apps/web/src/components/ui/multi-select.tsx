import { Popover } from "@base-ui/react/popover";
import { Check, ChevronDown, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FILTER_SELECT_TRIGGER } from "./filter-search";
import { SELECT_TRIGGER_CLASS } from "./select";

/** One choice of a MultiSelect; `color` draws its dot (a sale type's colour). */
export interface MultiOption {
  value: string;
  label: string;
  color?: string;
  icon?: ReactNode;
}

function Box({ state }: { state: "all" | "some" | "none" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-[5px] border",
        state === "all"
          ? "border-primary bg-primary"
          : state === "some"
            ? "border-primary bg-primary/35"
            : "border-muted-foreground/50",
      )}
    >
      {state === "all" && (
        <Check
          className="size-[11px] text-primary-foreground"
          strokeWidth={3.5}
        />
      )}
      {state === "some" && (
        <Minus className="size-[11px] text-primary" strokeWidth={3.5} />
      )}
    </span>
  );
}

/** A filter dropdown that picks several values: closed it looks like every
 * other filter select ("All types", one name, two names, or "3 of 4");
 * open, "All" and one checkbox row per option, each ticked while it is
 * included. Unticking the last one goes back to all. `value` lists the ticked
 * values; an empty list or every value is "all". */
export function MultiSelect({
  id,
  label,
  allLabel,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  allLabel: string;
  options: MultiOption[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const picked =
    value.length === 0
      ? options.map((o) => o.value)
      : options.filter((o) => value.includes(o.value)).map((o) => o.value);
  const all = picked.length === options.length;
  const summary = all
    ? allLabel
    : picked.length <= 2
      ? options
          .filter((o) => picked.includes(o.value))
          .map((o) => o.label)
          .join(", ")
      : `${picked.length} of ${options.length}`;
  const emit = (next: string[]) =>
    onChange(
      next.length === 0 || next.length === options.length
        ? []
        : options.filter((o) => next.includes(o.value)).map((o) => o.value),
    );
  const toggle = (v: string) =>
    emit(picked.includes(v) ? picked.filter((x) => x !== v) : [...picked, v]);
  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <button
            type="button"
            id={id}
            aria-label={`${label}: ${summary}`}
            data-slot="select-trigger"
            data-size="default"
            className={cn(
              SELECT_TRIGGER_CLASS,
              FILTER_SELECT_TRIGGER,
              "w-full min-w-0",
            )}
          />
        }
      >
        <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-left">
          {!all &&
            picked.length <= 2 &&
            options
              .filter((o) => picked.includes(o.value) && (o.icon || o.color))
              .map((o) =>
                o.icon ? (
                  <span key={o.value} className="inline-flex shrink-0">
                    {o.icon}
                  </span>
                ) : (
                  <span
                    key={o.value}
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: o.color }}
                  />
                ),
              )}
          <span className="truncate">{summary}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          sideOffset={6}
          align="start"
          collisionPadding={16}
          className="z-[70]"
        >
          <Popover.Popup
            aria-label={label}
            className="w-[max(var(--anchor-width),12rem)] max-w-[calc(100vw-2rem)] rounded-lg border border-border surface-solid p-1.5 text-popover-foreground shadow-xl outline-none"
          >
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={all ? true : "mixed"}
              onClick={() => emit([])}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-muted"
            >
              <Box state={all ? "all" : "some"} />
              {allLabel}
            </button>
            <div className="my-1 border-t border-border" />
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                role="menuitemcheckbox"
                aria-checked={picked.includes(o.value)}
                onClick={() => toggle(o.value)}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <Box state={picked.includes(o.value) ? "all" : "none"} />
                {o.icon ??
                  (o.color && (
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: o.color }}
                    />
                  ))}
                <span className="truncate">{o.label}</span>
              </button>
            ))}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
