import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** A control beside the title, before the close button. */
  action?: ReactNode;
  children: ReactNode;
  /** Pinned under the scrolling body, above the iPhone home indicator. */
  footer?: ReactNode;
  className?: string;
}

/** A phone sheet that slides up from the bottom (drag handle, title, close
 * button, scrolling body, optional pinned footer) -- the phone stand-in for
 * popovers and side panels. Controlled; render the trigger yourself. */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  action,
  children,
  footer,
  className,
}: BottomSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/60 duration-200 motion-reduce:animate-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100dvh-4rem)] flex-col surface-solid rounded-t-2xl border-t border-border text-card-foreground outline-none duration-200 motion-reduce:animate-none data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom",
            className,
          )}
        >
          <div className="flex justify-center pt-2 pb-1" aria-hidden="true">
            <span className="h-1 w-10 rounded-full bg-muted-foreground/40" />
          </div>
          <div className="flex items-center justify-between gap-2 pr-2 pl-5">
            <DialogPrimitive.Title className="min-w-0 flex-1 text-xl font-semibold">
              {title}
            </DialogPrimitive.Title>
            {action}
            <DialogPrimitive.Close
              aria-label={"Close"}
              className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X className="size-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 pt-2 pb-5">
            {children}
          </div>
          {footer && (
            <div
              className="border-t border-border px-5 pt-3"
              style={{
                paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
              }}
            >
              {footer}
            </div>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
