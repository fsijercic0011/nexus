import { SlidersHorizontal, X } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";

interface FilterBarProps {
  /** Stays inline on both sizes. */
  search: ReactNode;
  /** The other controls: inline on desktop, one per row in the phone sheet. */
  children: ReactNode;
  /** Filters (in `children`) that differ from their defaults; badge on the phone button. */
  activeCount: number;
  /** Rows the current filters leave, for the sheet's "Show N" button. */
  resultCount: number;
  /** Phone sheet "Clear": resets the controls in the sheet, not the search. */
  onClearSheet: () => void;
  /** Desktop reset button: resets search and every control. */
  onReset: () => void;
  /** Disables the desktop reset button when nothing is filtered. */
  resetDisabled?: boolean;
}

/** The "Filters" toggle with its count of non-default filters. */
function FiltersButton({
  activeCount,
  open,
  controls,
  onClick,
}: {
  activeCount: number;
  open: boolean;
  controls?: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 shrink-0 gap-2 rounded-md px-3"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onClick}
    >
      <SlidersHorizontal aria-hidden="true" />
      {"Filters"}
      {activeCount > 0 && (
        <>
          <span
            aria-hidden="true"
            className="flex size-5 items-center justify-center rounded-full bg-foreground text-caption font-semibold text-background tabular-nums"
          >
            {activeCount}
          </span>
          <span className="sr-only">{`${activeCount} active`}</span>
        </>
      )}
    </Button>
  );
}

/** Search plus filter controls. Desktop: search, a "Filters" toggle and a
 * clear button on one line; the toggle opens a row of controls beneath them,
 * closed on arrival unless a filter is already set. Phone: search inline, the
 * controls in a BottomSheet behind "Filters"; changes apply live and "Show N"
 * only closes the sheet. */
export function FilterBar({
  search,
  children,
  activeCount,
  resultCount,
  onClearSheet,
  onReset,
  resetDisabled,
}: FilterBarProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [rowOpen, setRowOpen] = useState(activeCount > 0);
  const rowId = useId();

  if (!isMobile) {
    return (
      <div className="surface-card rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">{search}</div>
          <FiltersButton
            activeCount={activeCount}
            open={rowOpen}
            controls={rowId}
            onClick={() => setRowOpen(!rowOpen)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-md text-muted-foreground hover:text-foreground"
            disabled={resetDisabled}
            onClick={onReset}
            aria-label={"Clear filters"}
            title={"Clear filters"}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        <div
          id={rowId}
          hidden={!rowOpen}
          className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3"
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="surface-card flex items-center gap-2 rounded-lg border p-2">
      <div className="min-w-0 flex-1">{search}</div>
      <FiltersButton
        activeCount={activeCount}
        open={open}
        onClick={() => setOpen(true)}
      />
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title={"Filters"}
        footer={
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={activeCount === 0}
              onClick={onClearSheet}
            >
              {"Clear filters"}
            </Button>
            <Button
              type="button"
              size="lg"
              className="flex-1"
              onClick={() => setOpen(false)}
            >{`Show ${resultCount}`}</Button>
          </div>
        }
      >
        {/* Same controls as the desktop row: icon-led, labels for screen readers only. */}
        <div className="flex flex-col gap-3 [&>*]:w-full">{children}</div>
      </BottomSheet>
    </div>
  );
}
