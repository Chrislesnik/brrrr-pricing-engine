"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Loader2, Search, Download, MoreHorizontal, Archive } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu";
import { ArchiveConfirmDialog } from "@/components/archive/archive-confirm-dialog";
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
  mid_score: number | null;
  pull_type: string | null;
  report_date: string | null;
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

function getReportStatus(report: CreditReport): { label: string; colorVar: string; bgVar: string } {
  const dateStr = report.report_date ?? report.created_at;
  if (!dateStr) return { label: "Unknown", colorVar: "--muted-foreground", bgVar: "--muted" };
  const ageMs = Date.now() - new Date(dateStr).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays > 90) return { label: "Expired", colorVar: "--danger", bgVar: "--danger-muted" };
  if (ageDays >= 75) return { label: "Expiring Soon", colorVar: "--warning", bgVar: "--warning-muted" };
  return { label: "Valid", colorVar: "--success", bgVar: "--success-muted" };
}

function ScoreWidget({ score }: { score: number | null }) {
  if (score === null || score === undefined) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const num = Number(score);
  let colorVar = "--danger";
  let bgVar = "--danger-muted";
  if (num >= 740) { colorVar = "--success"; bgVar = "--success-muted"; }
  else if (num >= 670) { colorVar = "--warning"; bgVar = "--warning-muted"; }

  return (
    <span
      className="inline-flex items-center justify-center rounded-md px-2.5 py-1 text-sm font-semibold tabular-nums min-w-[48px]"
      style={{
        backgroundColor: `hsl(var(${bgVar}))`,
        color: `hsl(var(${colorVar}))`,
      }}
    >
      {num}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Actions Cell                                                               */
/* -------------------------------------------------------------------------- */

function ActionsCell({
  report,
  onArchived,
}: {
  report: CreditReport;
  onArchived: (id: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function handleArchive() {
    setArchiving(true);
    try {
      const res = await fetch(`/api/credit-reports/${report.id}`, { method: "DELETE" });
      if (!res.ok) {
        const t = await res.text();
        alert(`Failed to archive: ${t || res.status}`);
        return;
      }
      onArchived(report.id);
    } catch {
      alert("Failed to archive");
    } finally {
      setArchiving(false);
    }
  }

  return (
    <>
      <div className="flex justify-center">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {report.download_url && (
              <>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(report.download_url!, "_blank");
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onSelect={(e) => {
                e.preventDefault();
                setConfirmOpen(true);
              }}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ArchiveConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleArchive}
        recordType="credit report"
        loading={archiving}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Columns                                                                    */
/* -------------------------------------------------------------------------- */

function getColumns(onArchived: (id: string) => void): ColumnDef<CreditReport>[] {
  return [
  {
    id: "report_id_col",
    accessorKey: "report_id",
    header: "Report ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.report_id || row.original.id.slice(0, 12) + "..."}
      </span>
    ),
  },
  {
    id: "borrower",
    accessorFn: (row) => getBorrowerName(row),
    header: "Borrower",
    cell: ({ row }) => (
      <span className="font-medium truncate">{getBorrowerName(row.original)}</span>
    ),
  },
  {
    id: "status",
    accessorFn: (row) => getReportStatus(row).label,
    header: () => <span className="w-full text-center block">Status</span>,
    cell: ({ row }) => {
      const { label, colorVar, bgVar } = getReportStatus(row.original);
      return (
        <div className="flex justify-center">
          <span
            className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `hsl(var(${bgVar}))`,
              color: `hsl(var(${colorVar}))`,
            }}
          >
            {label}
          </span>
        </div>
      );
    },
  },
  {
    id: "aggregator",
    accessorFn: (row) => row.aggregator_link?.aggregator || row.aggregator || "—",
    header: () => <span className="w-full text-center block">Aggregator</span>,
    cell: ({ row }) => {
      const agg = row.original.aggregator_link?.aggregator || row.original.aggregator;
      return (
        <div className="flex justify-center">
          {agg ? (
            <Badge variant="secondary" className="text-xs capitalize">{agg}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      );
    },
  },
  {
    id: "transunion",
    accessorKey: "transunion_score",
    header: () => <span className="w-full text-center block">TU</span>,
    cell: ({ row }) => <div className="flex justify-center"><ScoreWidget score={row.original.transunion_score} /></div>,
  },
  {
    id: "experian",
    accessorKey: "experian_score",
    header: () => <span className="w-full text-center block">EX</span>,
    cell: ({ row }) => <div className="flex justify-center"><ScoreWidget score={row.original.experian_score} /></div>,
  },
  {
    id: "equifax",
    accessorKey: "equifax_score",
    header: () => <span className="w-full text-center block">EQ</span>,
    cell: ({ row }) => <div className="flex justify-center"><ScoreWidget score={row.original.equifax_score} /></div>,
  },
  {
    id: "report_date",
    accessorKey: "report_date",
    header: () => <span className="w-full text-center block">Report Date</span>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <span className="text-sm text-muted-foreground">{formatDate(row.original.report_date ?? row.original.created_at)}</span>
      </div>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <ActionsCell report={row.original} onArchived={onArchived} />
    ),
  },
  ];
}

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

  const onArchived = useCallback((id: string) => {
    setData((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const columns = useMemo(() => getColumns(onArchived), [onArchived]);

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
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).toLowerCase();
      const name = getBorrowerName(row.original).toLowerCase();
      const rid = (row.original.report_id || row.original.id || "").toLowerCase();
      return name.includes(search) || rid.includes(search);
    },
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
            placeholder="Search by borrower name or report ID..."
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
