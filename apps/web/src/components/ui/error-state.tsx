import { Button } from "@/components/ui/button";

/** Inline load failure with an optional retry. */
export function ErrorState({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 py-16 text-center"
    >
      <p className="max-w-md text-sm leading-relaxed text-destructive">
        {message}
      </p>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          disabled={retrying}
          onClick={onRetry}
        >
          {"Try again"}
        </Button>
      )}
    </div>
  );
}
