import type { PageId } from "@/lib/page-info";
import { PageInfoButton } from "./page-info";

/** The utilities every page heading carries: today only the page's ⓘ, on
 * phones and desktop alike. Notifications join it when they exist. */
export function PageUtilities({ page }: { page: PageId }) {
  return <PageInfoButton page={page} />;
}
