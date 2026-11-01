import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  neutral: "border-border bg-muted text-muted-foreground",
  primary: "border-primary/40 bg-primary/12 text-primary",
  destructive: "border-destructive/40 bg-destructive/10 text-destructive",
  success: "border-success/40 bg-success/12 text-success",
  warning: "border-warning/40 bg-warning/12 text-warning",
  info: "border-[color:var(--nav-blue-4)]/40 bg-[color:var(--nav-blue-4)]/10 text-[color:var(--nav-blue-1)]",
} as const;

/** A short status label (e.g. Draft, Published). */
export function Badge({
  variant = "neutral",
  className,
  children,
}: {
  variant?: keyof typeof VARIANTS;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
