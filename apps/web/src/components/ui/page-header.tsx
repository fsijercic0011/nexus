import type { ReactNode } from "react";
import type { PageId } from "@/lib/page-info";
import { PageUtilities } from "./page-utilities";

/** The page's title: h1, an optional description, an optional leading
 * element (a back button), the page's ⓘ and page actions on the right.
 * Phones separate it from the content with a divider; desktop with space. */
export function PageHeader({
  title,
  page,
  description,
  leading,
  actions,
}: {
  title: ReactNode;
  page: PageId;
  description?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 max-md:border-b max-md:border-border max-md:pb-6 md:pb-2">
      <div className="flex min-w-0 items-start gap-2">
        {leading}
        <div className="min-w-0">
          <h1 className="min-w-0 text-2xl font-semibold md:text-3xl">
            {title}
          </h1>
          {description && (
            <div className="mt-1 mb-5 text-sm text-muted-foreground">
              {description}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <PageUtilities page={page} />
        {actions}
      </div>
    </header>
  );
}
