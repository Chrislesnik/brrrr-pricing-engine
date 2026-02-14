"use client";

import { useEffect, useState } from "react";
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
import { Loader2, Search, FileText } from "lucide-react";
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
import { cn } from "@repo/lib/cn";
import { BackgroundDetailSheet } from "./background-detail-sheet";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface BorrowerJoin {
  id: string;
  first_name: string;
  last_name: string;
}

interface EntityJoin {
  id: string;
  entity_name: string;
}

export interface BackgroundReport {
  id: string;
  organization_id: string;
  borrower_id: string | null;
  entity_id: string | null;
  is_entity: boolean;
  report_type: string | null;
  status: string | null;
  report_date: string | null;
  storage_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  borrowers: BorrowerJoin | null;
  entities: EntityJoin | null;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getDisplayName(report: BackgroundReport): string {
  if (report.is_entity && report.entities) {
    return report.entities.entity_name || "Unknown Entity";
  }
  if (report.borrowers) {
    const first = report.borrowers.first_name || "";
    const last = report.borrowers.last_name || "";
    return `${first} ${last}`.trim() || "Unknown Individual";
  }
  return "Unknown";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/*  Columns                                                                    */
/* -------------------------------------------------------------------------- */

const columns: ColumnDef<BackgroundReport>[] = [
  {
    id: "name",
    accessorFn: (row) => getDisplayName(row),
    header: "Name",
    cell: ({ row }) => {
      const name = getDisplayName(row.original);
      return (
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium truncate">{name}</span>
        </div>
      );
    },
  },
  {
    id: "type",
    accessorFn: (row) => (row.is_entity ? "Entity" : "Individual"),
    header: "Type",
    cell: ({ row }) => (
      <Badge variant={row.original.is_entity ? "default" : "secondary"} className="text-xs">
        {row.original.is_entity ? "Entity" : "Individual"}
      </Badge>
    ),
  },
  {
    id: "report_type",
    accessorKey: "report_type",
    header: "Report Type",
    cell: ({ row }) => (
      <span className="text-sm capitalize text-muted-foreground">
        {row.original.report_type || "—"}
      </span>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status || "pending";
      return (
        <Badge
          variant="outline"
          className={cn(
            "text-xs capitalize",
            status === "completed" && "border-green-500/50 text-green-600 dark:text-green-400",
            status === "failed" && "border-red-500/50 text-red-600 dark:text-red-400",
            status === "pending" && "border-yellow-500/50 text-yellow-600 dark:text-yellow-400"
          )}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.created_at)}
      </span>
    ),
  },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function BackgroundTable() {
  const [data, setData] = useState<BackgroundReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedReport, setSelectedReport] = useState<BackgroundReport | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        const res = await fetch("/api/background-reports");
        if (!res.ok) throw new Error("Failed to fetch background reports");
        const json = await res.json();
        setData(json.reports ?? []);
      } catch (err) {
        console.error("Error fetching background reports:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

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
      {/* Search */}
      <div className="flex items-center gap-2 pb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, type..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="cursor-pointer select-none"
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
                  No background reports found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedReport(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Sheet */}
      <BackgroundDetailSheet
        report={selectedReport}
        open={!!selectedReport}
        onOpenChange={(open) => {
          if (!open) setSelectedReport(null);
        }}
      />
    </>
  );
}
