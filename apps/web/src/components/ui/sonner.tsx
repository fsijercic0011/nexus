import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useIsMobile } from "@/hooks/useIsMobile";

const Toaster = ({ ...props }: ToasterProps) => {
  const barOffset = useIsMobile()
    ? "calc(4.5rem + env(safe-area-inset-bottom))"
    : undefined;
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      // Phones: clear the fixed bottom bar. Sonner reads --offset-bottom above 600px and
      // --mobile-offset-bottom at or below it, so both get the bar-clearing value on phones.
      offset={{ bottom: barOffset ?? 24 }}
      mobileOffset={{ bottom: barOffset ?? 16 }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
