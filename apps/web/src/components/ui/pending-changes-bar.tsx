import { Button } from "@/components/ui/button";

/** Floating "Unsaved changes — Discard / Save" bar for pages that stage edits
 * locally and save them at once. Renders nothing without changes. */
export function PendingChangesBar({
  count,
  onDiscard,
  onSave,
  saveLabel,
  pending,
}: {
  count: number;
  onDiscard: () => void;
  onSave: () => void;
  saveLabel?: string;
  pending?: boolean;
}) {
  if (count <= 0) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-40 mx-auto flex max-w-xl items-center gap-2 rounded-xl border border-primary/40 bg-popover py-2 pr-2 pl-4 shadow-lg md:bottom-6"
    >
      <span className="min-w-0 flex-1 truncate text-sm">{`Unsaved changes: ${count}`}</span>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={onDiscard}
      >
        {"Discard"}
      </Button>
      <Button size="sm" disabled={pending} onClick={onSave}>
        {saveLabel ?? "Save"}
      </Button>
    </div>
  );
}
