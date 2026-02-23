"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  ColumnOrderState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Loader2,
  Search,
  Download,
  MoreHorizontal,
  Archive,
  Columns2,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@repo/ui/shadcn/badge";
import { Button } from "@repo/ui/shadcn/button";
import { Checkbox } from "@repo/ui/shadcn/checkbox";
import { Input } from "@repo/ui/shadcn/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu";
import { cn } from "@repo/lib/cn";
import { DraggableTableHeader, PINNED_RIGHT_SET, FIXED_COLUMNS } from "@/components/data-table/draggable-table-header";
import { DealsStylePagination } from "@/components/data-table/data-table-pagination";
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

function formatColumnName(columnId: string): string {
  const map: Record<string, string> = {
    report_id_col: "Report ID",
    borrower: "Borrower",
    status: "Status",
    aggregator: "Aggregator",
    transunion: "TransUnion",
    experian: "Experian",
    equifax: "Equifax",
    report_date: "Report Date",
  };
  return map[columnId] ?? columnId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
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
      <div className="flex justify-end" data-ignore-row-click>
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
            <DropdownMenuGroup>
              {report.download_url && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(report.download_url!, "_blank");
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            {report.download_url && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
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
            </DropdownMenuGroup>
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
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
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
      header: "Status",
      cell: ({ row }) => {
        const { label, colorVar, bgVar } = getReportStatus(row.original);
        return (
          <span
            className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `hsl(var(${bgVar}))`,
              color: `hsl(var(${colorVar}))`,
            }}
          >
            {label}
          </span>
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
      cell: ({ row }) => <ScoreWidget score={row.original.transunion_score} />,
      enableSorting: true,
    },
    {
      id: "experian",
      accessorKey: "experian_score",
      header: "EX",
      cell: ({ row }) => <ScoreWidget score={row.original.experian_score} />,
      enableSorting: true,
    },
    {
      id: "equifax",
      accessorKey: "equifax_score",
      header: "EQ",
      cell: ({ row }) => <ScoreWidget score={row.original.equifax_score} />,
      enableSorting: true,
    },
    {
      id: "report_date",
      accessorKey: "report_date",
      header: "Report Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.report_date ?? row.original.created_at)}</span>
      ),
      enableSorting: true,
    },
    {
      id: "row_actions",
      header: "",
      cell: ({ row }) => (
        <ActionsCell report={row.original} onArchived={onArchived} />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 60,
    },
  ];
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function CreditTable({ actionButton }: { actionButton?: React.ReactNode }) {
  const [data, setData] = useState<CreditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [selectedReport, setSelectedReport] = useState<CreditReport | null>(null);

  const onArchived = useCallback((id: string) => {
    setData((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const columns = useMemo(() => getColumns(onArchived), [onArchived]);

  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, {})
  );

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
    state: { sorting, globalFilter, columnVisibility, rowSelection, columnOrder },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    enableRowSelection: true,
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
    initialState: { pagination: { pageSize: 10 } },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const activeId = active.id as string;
      const overId = over.id as string;
      if (FIXED_COLUMNS.has(activeId) || FIXED_COLUMNS.has(overId)) return;
      const currentOrder = table.getAllLeafColumns().map((c) => c.id);
      const oldIndex = currentOrder.indexOf(activeId);
      const newIndex = currentOrder.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return;
      setColumnOrder(arrayMove(currentOrder, oldIndex, newIndex));
    }
  }

  const shouldIgnoreRowClick = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return !!target.closest("button, a, input, textarea, select, [data-ignore-row-click]");
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between py-4">
          <div className="h-8 w-[250px] bg-muted animate-pulse rounded" />
          <div className="flex items-center space-x-2">
            <div className="h-8 w-[150px] bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="rounded-md border">
          <div className="h-[400px] bg-muted animate-pulse" />
        </div>
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
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="w-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by borrower or report ID..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-8 max-w-sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 bg-background">
                  <Columns2 className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">Customize Columns</span>
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={col.getIsVisible()}
                      onCheckedChange={(value) => col.toggleVisibility(!!value)}
                    >
                      {formatColumnName(col.id)}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {actionButton}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted">
                  <SortableContext
                    items={table.getAllLeafColumns().map((c) => c.id).filter((id) => !FIXED_COLUMNS.has(id))}
                    strategy={horizontalListSortingStrategy}
                  >
                    {headerGroup.headers.map((header) => (
                      <DraggableTableHeader key={header.id} header={header} />
                    ))}
                  </SortableContext>
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
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer"
                    onClick={(e) => {
                      if (shouldIgnoreRowClick(e.target)) return;
                      setSelectedReport(row.original);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isPinned = PINNED_RIGHT_SET.has(cell.column.id);
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            "text-left",
                            isPinned && "bg-background group-hover/row:bg-transparent !px-1"
                          )}
                          style={
                            isPinned
                              ? {
                                  position: "sticky",
                                  right: 0,
                                  zIndex: 10,
                                  boxShadow: "-4px 0 8px -4px rgba(0,0,0,0.08)",
                                }
                              : undefined
                          }
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <DealsStylePagination table={table} />
      </div>

      <CreditDetailSheet
        report={selectedReport}
        open={!!selectedReport}
        onOpenChange={(open) => {
          if (!open) setSelectedReport(null);
        }}
      />
    </DndContext>
  );
}
