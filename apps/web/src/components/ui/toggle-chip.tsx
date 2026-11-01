import { Check, Lock } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** An on/off pill for picking several values from a short row (a section's
 * permissions). The state is aria-pressed; on is the gold fill with a check,
 * off is an outlined pill. `locked` is on but fixed from elsewhere (a
 * permission a group grants): a tinted pill with a lock that cannot be
 * clicked. `readOnly` shows the state without the faded disabled look.
 * 40px on phones, 36px from md up. */
export function ToggleChip({
  pressed,
  locked,
  readOnly,
  className,
  children,
  onClick,
  ...props
}: Omit<ComponentProps<"button">, "type"> & {
  pressed: boolean;
  locked?: boolean;
  readOnly?: boolean;
}) {
  const inert = locked || readOnly;
  return (
    <button
      type="button"
      aria-pressed={pressed || !!locked}
      aria-disabled={inert || undefined}
      onClick={inert ? undefined : onClick}
      {...props}
      className={cn(
        "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 md:h-9",
        locked
          ? "cursor-default border-foreground/30 bg-foreground/10 text-foreground"
          : pressed
            ? "border-transparent bg-foreground text-background"
            : cn(
                "border-border text-muted-foreground",
                !readOnly && "hover:border-foreground/40 hover:text-foreground",
              ),
        readOnly && "cursor-default",
        className,
      )}
    >
      {locked ? (
        <Lock className="size-3.5" aria-hidden="true" />
      ) : (
        pressed && (
          <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
        )
      )}
      {children}
    </button>
  );
}
