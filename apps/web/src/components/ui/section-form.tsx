import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useRef, useState } from "react";
import { useBeforeUnload, useBlocker } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormActions } from "@/components/ui/form-field";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { errorMessage } from "@/lib/api";

/** One section of a record (a profile, the household) as a form: one Save, Undo, and a guard on leaving with unsaved edits.
 * Newer saved data (another tab) only replaces the fields while nothing is edited. */
export function SectionForm<T extends Record<string, unknown>>({
  queryKey,
  initial,
  editable,
  valid,
  save,
  notice,
  children,
}: {
  /** Invalidated after a save and on reload. */
  queryKey: readonly unknown[];
  initial: T;
  editable: boolean;
  valid?: (values: T) => boolean;
  save: (values: T) => Promise<unknown>;
  notice?: ReactNode;
  children: (
    values: T,
    set: <K extends keyof T>(key: K, value: T[K]) => void,
    readOnly: boolean,
  ) => ReactNode;
}) {
  const client = useQueryClient();
  const [values, setValues] = useState<T>(initial);
  const [base, setBase] = useState({ initial });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null);
  const bypass = useRef(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(base.initial);
  // Adopt newer saved data only while nothing is edited (derived state, set during render).
  if (
    !dirty &&
    !busy &&
    JSON.stringify(initial) !== JSON.stringify(base.initial)
  ) {
    setBase({ initial });
    setValues(initial);
  }
  const ok = !valid || valid(values);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !bypass.current &&
      dirty &&
      currentLocation.pathname !== nextLocation.pathname,
  );
  useBeforeUnload((event) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  const set = <K extends keyof T>(key: K, value: T[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  async function submit(leaving = false) {
    setBusy(true);
    setError(null);
    try {
      await save(values);
      // The saved values are the new baseline, so the form is clean and adopts the refetched data.
      setBase({ initial: values });
      toast.success("Saved.");
      if (leaving && blocker.state === "blocked") {
        bypass.current = true;
        blocker.proceed();
      }
      await client.invalidateQueries({ queryKey });
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card pad="form">
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (dirty && ok && !busy) void submit();
        }}
      >
        {notice}
        {!editable && (
          <p className="text-sm text-muted-foreground">
            You can view this section but not edit it.
          </p>
        )}
        <fieldset disabled={!editable || busy} className="min-w-0 space-y-6">
          {children(values, set, !editable)}
        </fieldset>
        {error != null && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 text-sm text-destructive"
          >
            {errorMessage(error)}
          </div>
        )}
        {editable && (
          <FormActions
            status={
              busy ? "Saving…" : dirty ? "Unsaved changes" : "All changes saved"
            }
          >
            <Button
              type="button"
              variant="outline"
              disabled={!dirty || busy}
              onClick={() => {
                setValues(base.initial);
                setError(null);
              }}
            >
              {"Undo changes"}
            </Button>
            <Button type="submit" disabled={!dirty || !ok || busy}>
              {"Save"}
            </Button>
          </FormActions>
        )}
      </form>
      <UnsavedChangesDialog
        open={blocker.state === "blocked"}
        pending={busy}
        canSave={dirty && ok}
        error={error != null ? errorMessage(error) : undefined}
        onCancel={() => {
          if (blocker.state === "blocked") blocker.reset();
        }}
        onDiscard={() => {
          if (blocker.state === "blocked") {
            bypass.current = true;
            blocker.proceed();
          }
        }}
        onSave={() => void submit(true)}
      />
    </Card>
  );
}
