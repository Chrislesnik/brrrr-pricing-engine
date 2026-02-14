"use client";

import { Fragment, useEffect, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Loader2, Search } from "lucide-react";
import { cn } from "@repo/lib/cn";
import { Badge } from "@repo/ui/shadcn/badge";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface BorrowerJoin {
  id: string;
  first_name: string;
  last_name: string;
}

interface AmcJoin {
  id: number;
  name: string;
}

export interface AppraisalOrder {
  id: number;
  organization_id: string;
  deal_id: string | null;
  amc_id: number | null;
  borrower_id: string | null;
  borrower_name: string | null;
  loan_number: string | null;
  file_number: string | null;
  order_type: string | null;
  order_status: string | null;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  property_zip: string | null;
  date_report_ordered: string | null;
  date_due: string | null;
  date_amc_vendor_assign: string | null;
  date_inspection_completed: string | null;
  date_report_received: string | null;
  created_at: string;
  borrowers: BorrowerJoin | null;
  appraisal_amcs: AmcJoin | null;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getAmcName(order: AppraisalOrder): string {
  return order.appraisal_amcs?.name || "—";
}

function getAddress(order: AppraisalOrder): string {
  const parts = [order.property_address, order.property_city, order.property_state, order.property_zip].filter(Boolean);
  return parts.join(", ") || "—";
}

function getBorrowerDisplay(order: AppraisalOrder): string {
  if (order.borrowers) {
    return `${order.borrowers.first_name || ""} ${order.borrowers.last_name || ""}`.trim() || "Unknown";
  }
  return order.borrower_name || "—";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split(/[-T]/);
  return `${m}/${d}/${y}`;
}

const STATUS_COLORS: Record<string, string> = {
  Ordered: "border-blue-500/50 text-blue-600 dark:text-blue-400",
  Assigned: "border-purple-500/50 text-purple-600 dark:text-purple-400",
  "Inspection Scheduled": "border-indigo-500/50 text-indigo-600 dark:text-indigo-400",
  Inspected: "border-cyan-500/50 text-cyan-600 dark:text-cyan-400",
  "Under Review": "border-yellow-500/50 text-yellow-600 dark:text-yellow-400",
  "Revision Requested": "border-orange-500/50 text-orange-600 dark:text-orange-400",
  Complete: "border-green-500/50 text-green-600 dark:text-green-400",
  Cancelled: "border-red-500/50 text-red-600 dark:text-red-400",
  "On Hold": "border-gray-500/50 text-gray-600 dark:text-gray-400",
};

/* -------------------------------------------------------------------------- */
/*  Columns                                                                    */
/* -------------------------------------------------------------------------- */

function buildColumns(): ColumnDef<AppraisalOrder>[] {
  return [
    {
      id: "expand",
      header: "",
      cell: () => null, // rendered manually in the row
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "amc",
      accessorFn: (row) => getAmcName(row),
      header: "AMC",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{getAmcName(row.original)}</span>
      ),
    },
    {
      id: "file_number",
      accessorKey: "file_number",
      header: "File #",
      cell: ({ row }) => (
        <span className="text-sm font-mono">{row.original.file_number || "—"}</span>
      ),
    },
    {
      id: "address",
      accessorFn: (row) => getAddress(row),
      header: "Address",
      cell: ({ row }) => (
        <span className="text-sm truncate max-w-[200px] block">{getAddress(row.original)}</span>
      ),
    },
    {
      id: "status",
      accessorKey: "order_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.order_status || "—";
        return (
          <Badge
            variant="outline"
            className={cn("text-xs", STATUS_COLORS[status] || "")}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: "file_type",
      accessorKey: "order_type",
      header: "File Type",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.order_type || "—"}</span>
      ),
    },
    {
      id: "deal_id",
      accessorKey: "deal_id",
      header: "Deal ID",
      cell: ({ row }) => (
        <span className="text-sm font-mono text-muted-foreground">
          {row.original.deal_id ? row.original.deal_id.slice(0, 8) + "..." : "—"}
        </span>
      ),
    },
  ];
}

/* -------------------------------------------------------------------------- */
/*  Expanded Detail Row                                                        */
/* -------------------------------------------------------------------------- */

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function ExpandedContent({ order }: { order: AppraisalOrder }) {
  return (
    <div className="grid grid-cols-7 gap-4 px-6 py-3">
      <DetailField label="Loan #" value={order.loan_number || "—"} />
      <DetailField label="Borrower(s)" value={getBorrowerDisplay(order)} />
      <DetailField label="Ordered" value={formatDate(order.date_report_ordered)} />
      <DetailField label="Due" value={formatDate(order.date_due)} />
      <DetailField label="Assigned" value={formatDate(order.date_amc_vendor_assign)} />
      <DetailField label="Inspected" value={formatDate(order.date_inspection_completed)} />
      <DetailField label="Complete" value={formatDate(order.date_report_received)} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function AppraisalsTable() {
  const [data, setData] = useState<AppraisalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const columns = buildColumns();

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const res = await fetch("/api/appraisal-orders");
        if (!res.ok) throw new Error("Failed to fetch appraisal orders");
        const json = await res.json();
        setData(json.orders ?? []);
      } catch (err) {
        console.error("Error fetching appraisal orders:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const toggleRow = (rowId: string) => {
    setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => String(row.id),
    initialState: { pagination: { pageSize: 20 } },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 pb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by AMC, address, file #..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      header.column.getCanSort() && "cursor-pointer select-none",
                      header.id === "expand" && "w-12 pl-3"
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No appraisal orders found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const isOpen = !!expandedRows[row.id];
                return (
                  <Fragment key={row.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={(e) => {
                        const interactive = (e.target as HTMLElement).closest(
                          "button, a, input, select, textarea"
                        );
                        if (interactive) return;
                        toggleRow(row.id);
                      }}
                      aria-expanded={isOpen}
                    >
                      {row.getVisibleCells().map((cell) => {
                        if (cell.column.id === "expand") {
                          return (
                            <TableCell key={cell.id} className="w-12 pl-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toggleRow(row.id)}
                                aria-label={isOpen ? "Collapse row" : "Expand row"}
                              >
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 transition-transform",
                                    isOpen ? "rotate-180" : "-rotate-90"
                                  )}
                                  aria-hidden="true"
                                />
                              </Button>
                            </TableCell>
                          );
                        }
                        return (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    {isOpen && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={columns.length} className="p-0">
                          <ExpandedContent order={row.original} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
