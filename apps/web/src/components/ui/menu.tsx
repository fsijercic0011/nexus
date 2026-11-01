import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** An action menu (Base UI: focus, arrow keys, typeahead, Escape). The
 * trigger renders the given element, usually an icon Button. */
export function Menu({
  trigger,
  icon,
  children,
  align = "end",
}: {
  trigger: ComponentProps<typeof MenuPrimitive.Trigger>["render"];
  /** Content of the trigger, e.g. a "more" icon. */
  icon: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
}) {
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger render={trigger}>{icon}</MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner
          align={align}
          sideOffset={4}
          className="isolate z-50"
        >
          <MenuPrimitive.Popup className="max-h-(--available-height) min-w-48 origin-(--transform-origin) overflow-y-auto rounded-lg surface-solid p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0">
            {children}
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}

const ITEM_CLASS =
  "flex min-h-10 w-full cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-primary/15 md:min-h-0 [&_svg]:size-4 [&_svg]:shrink-0";

export function MenuItem({
  destructive,
  className,
  ...props
}: ComponentProps<typeof MenuPrimitive.Item> & { destructive?: boolean }) {
  return (
    <MenuPrimitive.Item
      className={cn(
        ITEM_CLASS,
        destructive && "text-destructive data-highlighted:bg-destructive/15",
        className,
      )}
      {...props}
    />
  );
}

export function MenuSeparator() {
  return <MenuPrimitive.Separator className="my-1 h-px bg-border" />;
}

/** A labelled single choice inside a menu (e.g. "Move to category"). */
export function MenuRadioGroup({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <MenuPrimitive.Group>
      <MenuPrimitive.GroupLabel className="px-3 pt-2 pb-1 text-caption font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </MenuPrimitive.GroupLabel>
      <MenuPrimitive.RadioGroup
        value={value}
        onValueChange={(next) => onValueChange(String(next))}
      >
        {options.map((option) => (
          <MenuPrimitive.RadioItem
            key={option.value}
            value={option.value}
            closeOnClick
            className={cn(ITEM_CLASS, "pr-8")}
          >
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            <MenuPrimitive.RadioItemIndicator className="absolute right-3">
              <Check aria-hidden="true" />
            </MenuPrimitive.RadioItemIndicator>
          </MenuPrimitive.RadioItem>
        ))}
      </MenuPrimitive.RadioGroup>
    </MenuPrimitive.Group>
  );
}
