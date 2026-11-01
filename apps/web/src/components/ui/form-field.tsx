import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** One consistent label/control/help rhythm for workspace forms. */
export function FormField({
  children,
  fullWidth = false,
}: {
  children: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={cn("min-w-0 space-y-2", fullWidth && "md:col-span-2")}>
      {children}
    </div>
  );
}

/** Save state and actions share one footer, stacking cleanly on phones. */
export function FormActions({
  status,
  children,
}: {
  status: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div
        role="status"
        aria-live="polite"
        className="text-xs text-muted-foreground"
      >
        {status}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
