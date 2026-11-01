import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

// The surface itself (card colour, hairline edge, radius)
// comes from the global [data-slot="card"] rule in styles/theme.css, so
// nothing here sets a background, border colour or radius. Card adds no layout of its
// own either -- flex/grid/gap stay with the caller.
//   variant: `dashed` is the empty "add something" slot.
//   pad:     sm 16px, md 24px, lg 28px; form 16px phone/24px desktop.
//            `none` when the content brings its own (tables, lists).
const cardVariants = cva("border text-card-foreground", {
  variants: {
    variant: {
      default: "",
      dashed: "border-dashed border-border",
    },
    pad: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-7",
      form: "p-4 md:p-6",
    },
  },
  defaultVariants: {
    variant: "default",
    pad: "none",
  },
});

type CardProps = React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & {
    /** Render as a landmark/list element instead of a div. */
    as?: "div" | "section" | "article" | "aside" | "li";
  };

function Card({ as = "div", className, variant, pad, ...props }: CardProps) {
  const Tag = as as "div";
  return (
    <Tag
      data-slot="card"
      data-variant={variant ?? "default"}
      className={cn(cardVariants({ variant, pad }), className)}
      {...props}
    />
  );
}

// The title row at the top of a card: eyebrow title (with an optional icon
// and a badge right after it) and an action pinned to the far right.
function CardHeader({
  title,
  icon: Icon,
  iconColor,
  badge,
  action,
  className,
}: {
  title: React.ReactNode;
  icon?: LucideIcon;
  /** Tints the icon, e.g. a section's accent colour. */
  iconColor?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex items-center justify-between gap-3", className)}
    >
      <span className="flex min-w-0 items-center gap-2">
        {Icon && (
          <Icon
            className="size-3.5 shrink-0 text-muted-foreground"
            style={iconColor ? { color: iconColor } : undefined}
          />
        )}
        <span className="eyebrow text-muted-foreground">{title}</span>
        {badge}
      </span>
      {action}
    </div>
  );
}

export { Card, CardHeader };
