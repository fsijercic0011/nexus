import {
  type Cell,
  type Column,
  flexRender,
  type RowData,
  type Table as TanstackTable,
} from "@tanstack/react-table";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Phone cards for a data table (no phone sort picker: no
// table sorts yet).
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Plain-text column name for phone cards, needed when the header is a
     * component. Falls back to a string header, then the column id. */
    mobileLabel?: string;
    /** Where the column goes on a phone card: "title" (top-left, the row's
     * name), "aside" (top-right, e.g. a status) or "hidden". Omitted = a
     * labelled field in the card's grid. With no "title" column, the first
     * visible column is the title. */
    mobile?: "title" | "aside" | "hidden";
    /** A labelled field spanning the card's full width. */
    mobileWide?: boolean;
  }
}

export function columnLabel<TData>(column: Column<TData, unknown>): string {
  const meta = column.columnDef.meta;
  if (meta?.mobileLabel) return meta.mobileLabel;
  const header = column.columnDef.header;
  return typeof header === "string" ? header : column.id;
}

/** Splits a row's visible cells into title, aside and grid fields by each
 * column's `meta.mobile`. */
export function splitCardCells<TData>(cells: Cell<TData, unknown>[]) {
  const shown = cells.filter(
    (c) => c.column.columnDef.meta?.mobile !== "hidden",
  );
  let title = shown.filter((c) => c.column.columnDef.meta?.mobile === "title");
  const aside = shown.filter(
    (c) => c.column.columnDef.meta?.mobile === "aside",
  );
  let fields = shown.filter((c) => !c.column.columnDef.meta?.mobile);
  if (title.length === 0 && fields.length > 0) {
    title = fields.slice(0, 1);
    fields = fields.slice(1);
  }
  return { title, aside, fields };
}

interface TableCardsProps<TData> {
  table: TanstackTable<TData>;
  /** Pointer taps on the card (not on links or buttons inside it); `event.currentTarget` is the card. */
  onRowClick?: (row: TData, event: MouseEvent<HTMLElement>) => void;
  empty: ReactNode;
  className?: string;
}

/** The phone rendering of a TanStack table: one card per row instead of a
 * table that scrolls sideways. Reads the same table instance as the desktop
 * table, so filtering is shared. */
export function TableCards<TData>({
  table,
  onRowClick,
  empty,
  className,
}: TableCardsProps<TData>) {
  const rows = table.getRowModel().rows;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {rows.length === 0
        ? empty
        : rows.map((row) => {
            const { title, aside, fields } = splitCardCells(
              row.getVisibleCells(),
            );
            // A pointer convenience only: the card has no widget role, so screen
            // readers and keyboards reach the real links and buttons inside it
            // (rows that need a keyboard path expose one, e.g. an "aside" button).
            const open = onRowClick
              ? (event: MouseEvent<HTMLElement>) => {
                  const control = (event.target as Element).closest(
                    "a, button, input, select, textarea, label",
                  );
                  if (control && event.currentTarget.contains(control)) return;
                  onRowClick(row.original, event);
                }
              : undefined;
            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: a pointer shortcut; keyboard users open the row through its own link or controls.
              // biome-ignore lint/a11y/useKeyWithClickEvents: as above.
              <div
                key={row.id}
                onClick={open}
                className={cn(
                  "surface-card flex flex-col gap-3 rounded-xl border p-3.5 text-sm",
                  open && "surface-interactive cursor-pointer",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {title.map((cell) => (
                      <div key={cell.id} className="min-w-0">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </div>
                    ))}
                  </div>
                  {aside.length > 0 && (
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {aside.map((cell) => (
                        <div key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {fields.length > 0 && (
                  <dl className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-x-4 gap-y-2.5 border-t border-border pt-3">
                    {fields.map((cell) => (
                      <div
                        key={cell.id}
                        className={cn(
                          "flex min-w-0 flex-col gap-0.5",
                          cell.column.columnDef.meta?.mobileWide &&
                            "col-span-full",
                        )}
                      >
                        <dt className="eyebrow truncate">
                          {columnLabel(cell.column)}
                        </dt>
                        {/* Cells are written for a table column; on a card everything reads left to right. */}
                        <dd className="min-w-0 [&_.text-right]:text-left [&_.justify-end]:justify-start">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            );
          })}
    </div>
  );
}
