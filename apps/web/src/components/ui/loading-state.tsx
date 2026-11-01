import { Loader2 } from "lucide-react";

/** Centered spinner with a status label, for pages and sections that load. */
export function LoadingState({ label }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      <span>{label ?? "Loading…"}</span>
    </div>
  );
}
