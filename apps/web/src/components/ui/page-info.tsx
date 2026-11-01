import { Info } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { PAGE_INFO, type PageId } from "@/lib/page-info";

/** The page's ⓘ: opens the page's explanation from PAGE_INFO. */
export function PageInfoButton({ page }: { page: PageId }) {
  const [open, setOpen] = useState(false);
  const info = PAGE_INFO[page];
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
        aria-label="About this page"
        title="About this page"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Info className="size-4" strokeWidth={2.5} aria-hidden="true" />
      </Button>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={info.title}
        description={info.summary}
      >
        <ul className="flex flex-col gap-2.5">
          {info.points.map((point) => (
            <li key={point} className="flex gap-2.5 text-sm leading-relaxed">
              <span
                className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-foreground"
                aria-hidden="true"
              />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </ResponsiveDialog>
    </>
  );
}
