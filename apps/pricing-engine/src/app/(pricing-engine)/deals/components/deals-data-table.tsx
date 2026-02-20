"use client";

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnOrderState,
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@repo/ui/shadcn/badge";
import { Button } from "@repo/ui/shadcn/button";
import { Checkbox } from "@repo/ui/shadcn/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu";
import { Input } from "@repo/ui/shadcn/input";
/* Avatar / Textarea removed — Liveblocks handles comment rendering */
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table";
import {
  ArrowUpDown,
  Building,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Columns2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FilesIcon,
  Archive,
  FolderOpenIcon,
  MessageCircle,
  ChevronRight as ChevronRightIcon,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/shadcn/sheet";
import { cn } from "@repo/lib/cn";
import { DealTasksTab } from "./deal-tasks-tab";
import { InlineCommentsPanel } from "@/components/liveblocks/comments-panel";
import { RoleAssignmentDialog } from "@/components/role-assignment-dialog";

// Deal row returned from the pipeline API
interface DealWithRelations {
  id: string;
  inputs: Record<string, unknown> | null;
  [key: string]: unknown;
}

interface StarredInput {
  id: string;
  input_label: string;
  input_type: string;
  dropdown_options: string[] | null;
  starred: boolean;
  display_order: number;
}

/* CommentThread removed — replaced by Liveblocks InlineCommentsPanel */

// Column pinned to the right edge of the table (single combined column)
const PINNED_RIGHT_SET = new Set<string>(["row_actions"]);

// Draggable Header Component
const DraggableTableHeader = ({ header }: { header: any; table?: any }) => {
  const columnId = header.column.id;
  const isFixedColumn = columnId === "select" || columnId === "expand" || columnId === "row_actions";
  const isPinnedRight = PINNED_RIGHT_SET.has(columnId);

  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({
      id: header.column.id,
      disabled: isFixedColumn || isPinnedRight,
    });

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.5 : 1,
    position: isPinnedRight ? "sticky" : "relative",
    transform: isFixedColumn || isPinnedRight ? "none" : CSS.Translate.toString(transform),
    transition: isDragging ? "none" : "transform 0.2s ease",
    whiteSpace: "nowrap",
    width: header.column.getSize(),
    zIndex: isDragging ? 999 : isPinnedRight ? 20 : "auto",
    ...(isPinnedRight ? { right: 0, boxShadow: "-4px 0 8px -4px rgba(0,0,0,0.08)" } : {}),
  };

  return (
    <TableHead
      key={header.id}
      ref={setNodeRef}
      style={style}
      className={cn(
        "h-12 relative text-left",
        isDragging && "shadow-lg border-2 border-primary",
        isPinnedRight && "bg-muted !px-1"
      )}
    >
      <div className="flex items-center">
        {!isFixedColumn && !isPinnedRight && (
          <button
            className="flex items-center cursor-grab active:cursor-grabbing opacity-60 hover:opacity-100 p-0.5 rounded hover:bg-muted transition-colors mr-0.5"
            {...attributes}
            {...listeners}
            title="Drag to reorder column"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <div className="flex-1 text-left">
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
        </div>
      </div>
    </TableHead>
  );
};

/* -------------------------------------------------------------------------- */
/*  Dynamic cell renderer for starred input columns                            */
/* -------------------------------------------------------------------------- */

function renderDynamicCell(value: unknown, inputType: string): React.ReactNode {
  if (value == null || value === "") return <span className="text-muted-foreground">—</span>;

  switch (inputType) {
    case "currency": {
      const num = typeof value === "number" ? value : Number(value);
      if (isNaN(num)) return <span className="text-muted-foreground">—</span>;
      return (
        <div>
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(num)}
        </div>
      );
    }
    case "number": {
      return <div>{String(value)}</div>;
    }
    case "percentage": {
      return <div>{String(value)}%</div>;
    }
    case "date": {
      const str = String(value);
      try {
        return <div>{new Date(str).toLocaleDateString()}</div>;
      } catch {
        return <div>{str}</div>;
      }
    }
    case "dropdown": {
      const display = String(value)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      return <Badge variant="outline">{display}</Badge>;
    }
    case "boolean": {
      const bool = value === true || value === "true";
      return (
        <Badge variant={bool ? "default" : "outline"}>
          {bool ? "Yes" : "No"}
        </Badge>
      );
    }
    case "text":
    default:
      return <div className="max-w-[200px] truncate">{String(value)}</div>;
  }
}

/* -------------------------------------------------------------------------- */
/*  Column builder                                                             */
/* -------------------------------------------------------------------------- */

const createColumns = (
  router: { push: (path: string) => void },
  expandedRows: Set<string>,
  toggleRow: (dealId: string) => void,
  openCommentsSheet: (dealId: string) => void,
  openAssignDialog: (dealId: string) => void,
  starredInputs: StarredInput[],
): ColumnDef<DealWithRelations>[] => {
  const fixedStart: ColumnDef<DealWithRelations>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="p-2">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="p-2">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
    {
      id: "expand",
      header: () => null,
      cell: ({ row }) => {
        const dealId = String(row.original.id);
        const isExpanded = expandedRows.has(dealId);
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => toggleRow(dealId)}
            data-ignore-row-click
          >
            <ChevronRightIcon
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isExpanded && "rotate-90"
              )}
            />
          </Button>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
    {
      id: "deal_id",
      accessorKey: "id",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-1"
        >
          Deal ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm font-medium font-mono">
          {row.original.id || "—"}
        </div>
      ),
      enableHiding: true,
    },
  ];

  // Dynamic columns from starred inputs
  const dynamicCols: ColumnDef<DealWithRelations>[] = starredInputs.map(
    (input) => ({
      id: input.id,
      accessorFn: (row: DealWithRelations) => {
        const val = row.inputs?.[input.id];
        return val ?? null;
      },
      header: ({ column }: { column: any }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-1"
        >
          {input.input_label}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }: { getValue: () => unknown }) =>
        renderDynamicCell(getValue(), input.input_type),
    })
  );

  const fixedEnd: ColumnDef<DealWithRelations>[] = [
    {
      id: "row_actions",
      header: () => null,
      enableSorting: false,
      enableHiding: false,
      size: 80,
      cell: ({ row }) => {
        const deal = row.original;
        const dealId = String(deal.id);

        return (
          <div className="flex items-center gap-0.5">
            <Button
              className="h-8 w-8 p-0"
              onClick={() => openCommentsSheet(dealId)}
              size="sm"
              variant="ghost"
              data-ignore-row-click
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" data-ignore-row-click>
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" data-ignore-row-click>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push(`/deals/${deal.id}`)}
                  >
                    <FolderOpenIcon
                      size={16}
                      className="opacity-60"
                      aria-hidden="true"
                    />
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      openAssignDialog(dealId);
                    }}
                  >
                    <Users size={16} className="opacity-60" aria-hidden="true" />
                    Assigned To
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(deal.id.toString());
                    }}
                  >
                    <FilesIcon
                      size={16}
                      className="opacity-60"
                      aria-hidden="true"
                    />
                    Copy ID
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Archive size={16} aria-hidden="true" />
                    Archive
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return [...fixedStart, ...dynamicCols, ...fixedEnd];
};

export function DealsDataTable({
  onNewDeal,
}: {
  onNewDeal?: () => void
}) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [data, setData] = useState<DealWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    deal_id: false, // Deal ID hidden by default
  });
  const [rowSelection, setRowSelection] = useState({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [commentsSheetDealId, setCommentsSheetDealId] = useState<string | null>(null);
  const [assignDealId, setAssignDealId] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [starredInputs, setStarredInputs] = useState<StarredInput[]>([]);
  const [rowComments, setRowComments] = useState<
    Record<string, { comments: unknown[]; count: number; hasUnread: boolean }>
  >({});

  // Fetch starred inputs on mount
  useEffect(() => {
    let active = true;
    async function fetchInputs() {
      try {
        const res = await fetch("/api/inputs");
        if (!res.ok) return;
        const json = await res.json();
        // API returns array directly or { inputs: [...] }
        const allInputs = (Array.isArray(json) ? json : json.inputs ?? []) as StarredInput[];
        const starred = allInputs
          .filter((i) => i.starred)
          .sort((a, b) => a.display_order - b.display_order);
        if (active) {
          setStarredInputs(starred);
          // Set initial column order based on starred inputs
          setColumnOrder([
            "select",
            "expand",
            "deal_id",
            ...starred.map((i) => i.id),
            "row_actions",
          ]);
          // Default all dynamic columns to visible, keep deal_id hidden
          const vis: VisibilityState = { deal_id: false };
          starred.forEach((i) => { vis[i.id] = true; });
          setColumnVisibility(vis);
        }
      } catch (err) {
        console.error("Failed to fetch inputs:", err);
      }
    }
    fetchInputs();
    return () => { active = false; };
  }, []);

  /* loadComments / addComment removed — now handled by Liveblocks */

  const router = useRouter();
  
  const toggleRow = React.useCallback((dealId: string) => {
    setExpandedRows((prev) => {
      if (prev.has(dealId)) {
        return new Set();
      }
      return new Set([dealId]);
    });
  }, []);

  const openCommentsSheet = React.useCallback(
    (dealId: string) => {
      setCommentsSheetDealId(dealId);
    },
    []
  );

  const closeCommentsSheet = React.useCallback(() => {
    setCommentsSheetDealId(null);
  }, []);

  const openAssignDialog = React.useCallback(
    (dealId: string) => setAssignDealId(dealId),
    []
  );

  const columns = React.useMemo(
    () => createColumns(router, expandedRows, toggleRow, openCommentsSheet, openAssignDialog, starredInputs),
    [router, expandedRows, toggleRow, openCommentsSheet, openAssignDialog, starredInputs]
  );

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {})
  );

  useEffect(() => {
    let active = true
    async function fetchDeals() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/pipeline?view=deals");
        if (!response.ok) {
          throw new Error("Failed to load deals");
        }

        const payload = await response.json();
        if (active) {
          setData((payload?.deals ?? []) as DealWithRelations[]);
        }
      } catch (err) {
        console.error("Unexpected error fetching deals:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        if (active) {
          setError(errorMessage);
          setData([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchDeals();
    const handleRefresh = () => {
      fetchDeals();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("app:deals:changed", handleRefresh);
    }
    return () => {
      active = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("app:deals:changed", handleRefresh);
      }
    };
  }, []);

  useEffect(() => {
    if (!data.length) return;
    const ids = data.map((deal) => deal.id).join(",");
    let active = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/deals/comments/summary?ids=${encodeURIComponent(ids)}`
        );
        if (!res.ok) return;
        const json = (await res.json()) as {
          summary?: Record<string, { count: number; hasUnread: boolean }>;
        };
        if (!active) return;
        const summary = json?.summary ?? {};
        setRowComments((prev) => {
          const next = { ...prev };
          Object.entries(summary).forEach(([dealId, info]) => {
            const existing = next[dealId];
            next[dealId] = {
              comments: existing?.comments ?? [],
              count: info.count ?? existing?.count ?? 0,
              hasUnread: info.hasUnread ?? existing?.hasUnread ?? false,
            };
          });
          return next;
        });
      } catch {
        // ignore
      }
    })();
    return () => {
      active = false;
    };
  }, [data]);

 

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      columnOrder,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Format column names for display – built dynamically from starred inputs
  function formatColumnName(columnId: string): string {
    const columnNameMap: Record<string, string> = {
      deal_id: "Deal ID",
    };
    // Add starred input labels
    starredInputs.forEach((input) => {
      columnNameMap[input.id] = input.input_label;
    });

    return (
      columnNameMap[columnId] ||
      columnId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
  }

  // Handle drag end for column reordering
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      const activeId = active.id as string;
      const overId = over.id as string;

      // Don't allow dragging fixed columns
      if (
        activeId === "select" ||
        activeId === "expand" ||
        activeId === "row_actions" ||
        overId === "select" ||
        overId === "expand" ||
        overId === "row_actions"
      ) {
        return;
      }

      setColumnOrder((prev) => {
        const oldIndex = prev.indexOf(activeId);
        const newIndex = prev.indexOf(overId);

        // Create new order but preserve fixed positions
        const newOrder = arrayMove(prev, oldIndex, newIndex);

        // Ensure select and expand are first, row_actions is last
        const finalOrder = newOrder.filter(
          (id) => id !== "select" && id !== "expand" && id !== "row_actions"
        );
        const result = ["select", "expand", ...finalOrder, "row_actions"];

        return result;
      });
    }
  }

  // Track table container width for expanded rows
  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const shouldIgnoreRowClick = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return !!target.closest(
      "button, a, input, textarea, select, [data-ignore-row-click]"
    );
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-[250px] bg-muted animate-pulse rounded" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-[70px] bg-muted animate-pulse rounded" />
            <div className="h-8 w-[100px] bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="rounded-md border">
          <div className="h-[500px] bg-muted animate-pulse" />
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="h-8 w-[160px] bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-destructive/20 p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-destructive"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-destructive mb-1">
                Unable to load deals
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  // Trigger re-fetch by changing a dependency
                  window.location.reload();
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
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
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Filter deals..."
              value={
                (table
                  .getColumn("deal_id")
                  ?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table
                  .getColumn("deal_id")
                  ?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 bg-background"
                >
                  <Columns2 className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">Customize Columns</span>
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {formatColumnName(column.id)}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              className="h-8"
              onClick={() =>
                onNewDeal
                  ? onNewDeal()
                  : router.push("/balance-sheet/investor-portfolio/deals/new")
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Deal
            </Button>
          </div>
        </div>
        {/* Desktop table */}
        <div ref={tableContainerRef} className="hidden md:block rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted">
                  <SortableContext
                    items={columnOrder.filter(
                      (id) => id !== "select" && id !== "expand" && id !== "row_actions"
                    )}
                    strategy={horizontalListSortingStrategy}
                  >
                    {headerGroup.headers.map((header) => (
                      <DraggableTableHeader
                        key={header.id}
                        header={header}
                        table={table}
                      />
                    ))}
                  </SortableContext>
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const dealId = String(row.original.id);
                  const isExpanded = expandedRows.has(dealId);
                  return (
                    <React.Fragment key={row.id}>
                      <TableRow
                        className="cursor-pointer"
                        data-state={row.getIsSelected() && "selected"}
                        onClick={(event) => {
                          if (shouldIgnoreRowClick(event.target)) return;
                          router.push(`/deals/${dealId}`);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const isPinned = PINNED_RIGHT_SET.has(cell.column.id);
                          return (
                            <TableCell
                              key={cell.id}
                              className={cn(
                                "text-left",
                                isPinned && "bg-background !px-1"
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
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <tr>
                        <td
                          className="p-0 border-0 bg-muted/20"
                          colSpan={row.getVisibleCells().length}
                          style={{
                            position: "sticky",
                            left: 0,
                            width: containerWidth > 0 ? containerWidth : "100%",
                            maxWidth: containerWidth > 0 ? containerWidth : "100%",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            className="grid transition-[grid-template-rows] duration-200 ease-out"
                            style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
                          >
                            <div className="overflow-hidden">
                              <div className="overflow-y-auto" style={{ maxHeight: 600 }}>
                                <DealPipelineTasks dealId={dealId} />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-48 text-center"
                  >
                    <div className="flex flex-col items-center justify-center py-8">
                      <Building className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No deals found
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 max-w-md">
                        Get started by creating your first investment deal to
                        track performance and manage your portfolio.
                      </p>
                      <Button
                        onClick={() =>
                          onNewDeal
                            ? onNewDeal()
                            : router.push(
                                "/balance-sheet/investor-portfolio/deals/new"
                              )
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Deal
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden">
          <div className="space-y-3 rounded-md border p-3">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const deal = row.original;
                const dealId = String(deal.id);
                const inputs = deal.inputs ?? {};
                const topFields = starredInputs.slice(0, 3);
                return (
                  <div
                    key={row.id}
                    className="cursor-pointer rounded-lg border p-3"
                    onClick={() => router.push(`/deals/${dealId}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-semibold">
                          {topFields[0]
                            ? String(inputs[topFields[0].id] ?? dealId)
                            : dealId}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground font-mono">
                          {dealId.slice(0, 12)}...
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                          className="h-8 w-8 p-0"
                          onClick={() => openCommentsSheet(dealId)}
                          size="sm"
                          variant="ghost"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem onClick={() => router.push(`/deals/${dealId}`)}>
                                <FolderOpenIcon size={16} className="opacity-60" aria-hidden="true" />
                                Open
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openAssignDialog(dealId)}>
                                <Users size={16} className="opacity-60" aria-hidden="true" />
                                Assigned To
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(dealId)}>
                                <FilesIcon size={16} className="opacity-60" aria-hidden="true" />
                                Copy ID
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Archive size={16} aria-hidden="true" />
                                Archive
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {topFields.length > 1 && (
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {topFields.slice(1).map((field) => {
                          const val = inputs[field.id];
                          if (val == null || val === "") return null;
                          return (
                            <div key={field.id} className="truncate">
                              <span className="font-medium text-foreground">{field.input_label}</span>: {String(val)}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Building className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No deals found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first deal to get started.
                </p>
                <Button
                  onClick={() =>
                    onNewDeal
                      ? onNewDeal()
                      : router.push("/balance-sheet/investor-portfolio/deals/new")
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Deal
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">
                Rows per page
              </p>
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="w-[80px] h-9">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="40">40</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm font-medium text-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="h-4 w-4" />
                <span className="sr-only">First page</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="h-4 w-4" />
                <span className="sr-only">Last page</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Comments Sheet — powered by Liveblocks */}
        <Sheet open={commentsSheetDealId !== null} onOpenChange={(open) => {
          if (!open) closeCommentsSheet();
        }}>
          <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
            <SheetHeader className="px-6 py-4 border-b">
              <SheetTitle>
                {commentsSheetDealId ? `Deal ${commentsSheetDealId.slice(0, 8)}...` : "Deal Comments"}
              </SheetTitle>
              <SheetDescription>
                View and add comments for this deal
              </SheetDescription>
            </SheetHeader>
            {commentsSheetDealId && (
              <div className="flex-1 min-h-0">
                <InlineCommentsPanel dealId={commentsSheetDealId} />
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Role Assignment Dialog */}
        {assignDealId && (
          <RoleAssignmentDialog
            resourceType="deal"
            resourceId={assignDealId}
            open={true}
            onOpenChange={(open) => {
              if (!open) setAssignDealId(null);
            }}
          />
        )}
      </div>
    </DndContext>
  );
}
