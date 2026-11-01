import type { ReactNode } from "react";

/** A titled group of form fields: one column on phones, two from md. */
export function FormSection({
  title,
  description,
  children,
  layout = "balanced",
}: {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  layout?: "balanced" | "details";
}) {
  return (
    <section className="space-y-4">
      {(title || description) && (
        <div>
          {title && <h3 className="text-sm font-semibold">{title}</h3>}
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      <div
        className={
          layout === "details"
            ? "grid gap-x-4 gap-y-5 md:grid-cols-[minmax(0,2fr)_minmax(12rem,1fr)]"
            : "grid gap-4 md:grid-cols-2"
        }
      >
        {children}
      </div>
    </section>
  );
}
