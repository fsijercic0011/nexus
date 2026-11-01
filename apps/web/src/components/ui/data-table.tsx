import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import type { MouseEvent, ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableCards } from "@/components/ui/table-cards";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

interface DataTableProps<TData> {
  table: TanstackTable<TData>;
  columnCount: number;
  /** Shown instead of rows when the table has none. */
  empty: ReactNode;
  /** `event.currentTarget` is the clicked row (desktop) or card (phone). */
  onRowClick?: (row: TData, event: MouseEvent<HTMLElement>) => void;
  rowClassName?: (row: TData) => string | undefined;
}

/** A data table without pager, scroll mode or toolbar:
 * a table on desktop, one card per row on phones (columns place themselves
 * on the card with `meta.mobile` / `meta.mobileLabel`, see table-cards). */
export function DataTable<TData>({
  table,
  columnCount,
  empty,
  onRowClick,
  rowClassName,
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows;
  const isMobile = useIsMobile();

  if (isMobile)
    return <TableCards table={table} onRowClick={onRowClick} empty={empty} />;

  // The table brings its own card surface, so it looks the same on every page;
  // inside a <Card> the frame drops away (index.css).
  return (
    <div
      data-slot="data-table"
      className="surface-card overflow-hidden rounded-[calc(var(--radius)+2px)] border px-2 py-1"
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  onRowClick && "cursor-pointer hover:bg-primary/5",
                  rowClassName?.(row.original),
                )}
                onClick={
                  onRowClick
                    ? (event) => onRowClick(row.original, event)
                    : undefined
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columnCount}
                className="p-0 whitespace-normal"
              >
                {empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
