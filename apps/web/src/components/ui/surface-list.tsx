import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** A standalone list on the card surface: rows divided by hairlines
 * inside one framed container. A list already inside a card or dialog uses a
 * plain `divide-y` list instead. */
export function SurfaceList({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      className={cn(
        "surface-card divide-y divide-border overflow-hidden rounded-lg border",
        className,
      )}
      {...props}
    />
  );
}
