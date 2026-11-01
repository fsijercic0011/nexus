import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Pinned under the scrolling body (above the home indicator on phones). */
  footer?: ReactNode;
  initialFocus?: RefObject<HTMLElement | null>;
  finalFocus?: RefObject<HTMLElement | null>;
  /** false blocks Escape, backdrop click and the close button while busy. */
  dismissible?: boolean;
  /** "wide" is a 1040px record editor; "media" is an image viewer
   * (most of the screen, fixed height). Both bodies are unpadded so children
   * lay out their own panels. */
  size?: "default" | "wide" | "media";
  /** Controls in the header, before the close button (e.g. zoom). */
  actions?: ReactNode;
}

/** Centered modal on desktop, full-screen on phones. Controlled. */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  initialFocus,
  finalFocus,
  dismissible = true,
  size = "default",
  actions,
}: ResponsiveDialogProps) {
  const mobile = useIsMobile();
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (dismissible || next) onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/70" />
        <Dialog.Popup
          initialFocus={initialFocus}
          finalFocus={finalFocus}
          className={cn(
            "surface-solid fixed z-50 flex flex-col text-card-foreground outline-none",
            mobile
              ? "inset-0"
              : cn(
                  "top-1/2 left-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border shadow-2xl",
                  size === "wide"
                    ? "max-w-[1040px]"
                    : size === "media"
                      ? "h-[92dvh] w-[92vw] max-w-[1120px]"
                      : "max-w-2xl",
                ),
          )}
        >
          <div className="flex items-start gap-4 border-b border-border p-4 md:p-6">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-xl font-semibold">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </Dialog.Description>
              )}
            </div>
            {actions && (
              <div className="flex shrink-0 items-center gap-2">{actions}</div>
            )}
            <Dialog.Close
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!dismissible}
                  aria-label={"Close"}
                />
              }
            >
              <X aria-hidden="true" />
            </Dialog.Close>
          </div>
          <div
            className={cn(
              "min-h-0 flex-1 overflow-x-hidden overflow-y-auto",
              size === "default" && "p-4 md:p-6",
            )}
          >
            {children}
          </div>
          {footer && (
            <div
              className="flex justify-end gap-3 border-t border-border px-4 pt-3 md:px-6 md:pt-4"
              style={{
                paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
              }}
            >
              {footer}
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
