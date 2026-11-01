import type { LucideIcon } from "lucide-react";
import {
  FILTER_SELECT_TRIGGER,
  FilterField,
  FilterIcon,
  type FilterTone,
} from "@/components/ui/filter-search";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** A fixed-choice filter dropdown led by a colored icon; label for screen readers only. */
export function FilterSelect({
  id,
  label,
  value,
  items,
  onChange,
  icon,
  tone = "blue",
}: {
  id: string;
  label: string;
  value: string;
  items: { value: string; label: string }[];
  onChange: (value: string) => void;
  icon: LucideIcon;
  tone?: FilterTone;
}) {
  // Its first choice is the default ("all", or the shortest period).
  return (
    <FilterField
      id={id}
      label={label}
      tone={tone}
      active={value !== items[0]?.value}
    >
      <Select
        value={value}
        items={items}
        onValueChange={(next) => {
          if (next) onChange(next);
        }}
      >
        <SelectTrigger
          id={id}
          className={cn("w-full gap-3", FILTER_SELECT_TRIGGER)}
        >
          <FilterIcon icon={icon} tone={tone} />
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          align="start"
          sideOffset={6}
          alignItemWithTrigger={false}
          className="rounded-lg p-1.5"
        >
          {items.map((item) => (
            <SelectItem
              key={item.value}
              value={item.value}
              showIndicator={false}
              className="rounded-md px-3 py-2.5 data-selected:bg-muted data-selected:text-foreground"
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterField>
  );
}
