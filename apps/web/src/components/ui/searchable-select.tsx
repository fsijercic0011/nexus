import { Combobox } from "@base-ui/react/combobox";
import { ChevronDown, ChevronsUpDown, Search } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SELECT_TRIGGER_CLASS } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SearchOption {
  value: string;
  label: string;
}
/** Shared single-field searchable dropdown. Optional footer supports server paging.
 * Forms type straight into the field; `compact` (filter rows) looks like every
 * other dropdown when closed and searches from a field at the top of its list. */
export function SearchableSelect({
  id,
  value,
  onChange,
  options,
  label,
  placeholder,
  empty,
  disabled,
  onSearch,
  footer,
  compact = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchOption[];
  label: string;
  placeholder: string;
  empty: string;
  disabled?: boolean;
  onSearch?: (query: string) => void;
  footer?: React.ReactNode;
  compact?: boolean;
}) {
  // Stable while the value and its label hold: Base UI rewrites the typed text
  // to the selected label whenever the selected item's identity changes.
  const selectedLabel = options.find((option) => option.value === value)?.label;
  const selected = useMemo(
    () =>
      selectedLabel === undefined ? null : { value, label: selectedLabel },
    [value, selectedLabel],
  );
  const list = (
    <>
      <Combobox.Empty>
        <div className="px-3 py-5 text-sm text-muted-foreground">{empty}</div>
      </Combobox.Empty>
      <Combobox.List className="max-h-64 overflow-y-auto overscroll-contain">
        {(option: SearchOption) => (
          <Combobox.Item
            key={option.value}
            value={option}
            className="cursor-default rounded-md px-3 py-2.5 text-sm outline-none data-highlighted:bg-muted data-selected:bg-primary/15 data-selected:font-medium data-selected:text-primary"
          >
            {option.label}
          </Combobox.Item>
        )}
      </Combobox.List>
      {footer && (
        <div className="mt-1 border-t border-border pt-2">{footer}</div>
      )}
    </>
  );
  return (
    <Combobox.Root
      items={options}
      value={selected}
      isItemEqualToValue={(a, b) => a.value === b.value}
      disabled={disabled}
      openOnInputClick
      autoHighlight
      onValueChange={(option) => onChange(option?.value ?? "")}
      onInputValueChange={(input, details) => {
        if (details.reason === "input-change") onSearch?.(input);
      }}
      onOpenChange={(open) => {
        if (open) onSearch?.("");
      }}
    >
      {compact ? (
        <Combobox.Trigger
          id={id}
          aria-label={label}
          data-slot="select-trigger"
          data-size="default"
          className={cn(
            SELECT_TRIGGER_CLASS,
            "w-full rounded-md bg-card px-3 data-[size=default]:h-10",
          )}
        >
          <Combobox.Value>
            {(current: SearchOption | null) => (
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-left",
                  !current && "text-muted-foreground",
                )}
              >
                {current?.label ?? placeholder}
              </span>
            )}
          </Combobox.Value>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none size-4 text-muted-foreground"
          />
        </Combobox.Trigger>
      ) : (
        <Combobox.InputGroup className="relative min-w-0">
          <Combobox.Input
            id={id}
            aria-label={label}
            placeholder={placeholder}
            render={<Input className="pr-10" />}
          />
          <Combobox.Trigger
            aria-label={label}
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2"
              />
            }
          >
            <ChevronsUpDown
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
          </Combobox.Trigger>
        </Combobox.InputGroup>
      )}
      <Combobox.Portal>
        <Combobox.Positioner align="start" sideOffset={6} className="z-[70]">
          <Combobox.Popup
            data-slot="combobox-popup"
            className="w-[max(var(--anchor-width),14rem)] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border surface-solid p-1.5 text-popover-foreground shadow-xl outline-none"
          >
            {compact && (
              <div className="relative mb-1.5">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Combobox.Input
                  aria-label={label}
                  placeholder={"Search…"}
                  render={<Input className="h-9 pl-9" />}
                />
              </div>
            )}
            {list}
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
