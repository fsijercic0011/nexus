import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

/** Shared three-way exit decision. A failed Save keeps the dialog and edits. */
export function UnsavedChangesDialog({
  open,
  pending,
  canSave,
  error,
  onCancel,
  onDiscard,
  onSave,
}: {
  open: boolean;
  pending: boolean;
  canSave: boolean;
  error?: string;
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      title={"Save your changes?"}
      dismissible={!pending}
      footer={
        <>
          <Button variant="outline" disabled={pending} onClick={onCancel}>
            {"Cancel"}
          </Button>
          <Button variant="outline" disabled={pending} onClick={onDiscard}>
            {"Discard"}
          </Button>
          <Button disabled={pending || !canSave} onClick={onSave}>
            {"Save"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        {"Save or discard your changes before you continue."}
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </ResponsiveDialog>
  );
}
