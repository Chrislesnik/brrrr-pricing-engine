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
import { Loader2, Search, Download, FileText } from "lucide-react";
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
import { CreditDetailSheet } from "./credit-detail-sheet";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface BorrowerJoin {
  id: string;
  first_name: string;
  last_name: string;
}

export interface CreditReport {
  id: string;
  bucket: string | null;
  storage_path: string | null;
  status: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
  borrower_id: string | null;
  organization_id: string;
  aggregator: string | null;
  aggregator_id: string | null;
  report_id: string | null;
  borrowers: BorrowerJoin | null;
  aggregator_link: { aggregator: string; aggregator_data_id: string } | null;
  transunion_score: number | null;
  experian_score: number | null;
  equifax_score: number | null;
  pull_type: string | null;
  download_url: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getBorrowerName(report: CreditReport): string {
  if (report.borrowers) {
    const first = report.borrowers.first_name || "";
    const last = report.borrowers.last_name || "";
    return `${first} ${last}`.trim() || "Unknown";
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

function ScoreBadge({ score, label }: { score: number | null; label: string }) {
  if (score === null || score === undefined) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const num = Number(score);
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          num >= 740 && "text-green-600 dark:text-green-400",
          num >= 670 && num < 740 && "text-yellow-600 dark:text-yellow-400",
          num < 670 && "text-red-600 dark:text-red-400"
        )}
      >
        {num}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Columns                                                                    */
/* -------------------------------------------------------------------------- */

const columns: ColumnDef<CreditReport>[] = [
  {
    id: "borrower",
    accessorFn: (row) => getBorrowerName(row),
    header: "Borrower",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 min-w-0">
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="font-medium truncate">{getBorrowerName(row.original)}</span>
      </div>
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
            status === "stored" && "border-green-500/50 text-green-600 dark:text-green-400",
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
    id: "aggregator",
    accessorFn: (row) => row.aggregator_link?.aggregator || row.aggregator || "—",
    header: "Aggregator",
    cell: ({ row }) => {
      const agg = row.original.aggregator_link?.aggregator || row.original.aggregator;
      return agg ? (
        <Badge variant="secondary" className="text-xs capitalize">{agg}</Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    },
  },
  {
    id: "transunion",
    accessorKey: "transunion_score",
    header: "TU",
    cell: ({ row }) => <ScoreBadge score={row.original.transunion_score} label="TU" />,
  },
  {
    id: "experian",
    accessorKey: "experian_score",
    header: "EX",
    cell: ({ row }) => <ScoreBadge score={row.original.experian_score} label="EX" />,
  },
  {
    id: "equifax",
    accessorKey: "equifax_score",
    header: "EQ",
    cell: ({ row }) => <ScoreBadge score={row.original.equifax_score} label="EQ" />,
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{formatDate(row.original.created_at)}</span>
    ),
  },
  {
    id: "download",
    header: "",
    cell: ({ row }) => {
      if (!row.original.download_url) return null;
      return (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            window.open(row.original.download_url!, "_blank");
          }}
        >
          <Download className="h-4 w-4" />
        </Button>
      );
    },
  },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function CreditTable() {
  const [data, setData] = useState<CreditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedReport, setSelectedReport] = useState<CreditReport | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        const res = await fetch("/api/credit-report-data");
        if (!res.ok) throw new Error("Failed to fetch credit reports");
        const json = await res.json();
        setData(json.reports ?? []);
      } catch (err) {
        console.error("Error fetching credit reports:", err);
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
      <div className="flex items-center gap-2 pb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by borrower name..."
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
                  No credit reports found.
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

      <CreditDetailSheet
        report={selectedReport}
        open={!!selectedReport}
        onOpenChange={(open) => {
          if (!open) setSelectedReport(null);
        }}
      />
    </>
  );
}
