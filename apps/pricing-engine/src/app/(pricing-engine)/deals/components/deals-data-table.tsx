"use client";

import * as React from "react";
import { useState, useEffect } from "react";
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
import { Textarea } from "@repo/ui/shadcn/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/shadcn/avatar";
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
  BoltIcon,
  FilesIcon,
  TrashIcon,
  FolderOpenIcon,
  MessageCircle,
  Send,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
import { cn } from "@repo/lib/cn";
// Removed unused import

// Extended type with joined data
interface DealWithRelations {
  id: string;
  deal_name: string | null;
  deal_stage_2: string | null;
  loan_amount_total: number | null;
  funding_date: string | null;
  project_type: string | null;
  property_address: string | null;
  guarantor_name: string | null;
  loan_number: string | null;
}

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function CommentThread({
  comments,
  dealId,
  onAddComment,
}: {
  comments: Comment[];
  dealId: string;
  onAddComment: (dealId: string, content: string) => void;
}) {
  const [newComment, setNewComment] = useState("");

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment(dealId, newComment.trim());
    setNewComment("");
  };

  return (
    <div className="border-t bg-muted/30 px-4 py-3">
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No comments yet.
          </div>
        ) : (
          comments.map((comment) => (
            <div className="flex gap-3" key={comment.id}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.avatar} />
                <AvatarFallback className="text-xs">
                  {getInitials(comment.author)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {comment.author}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {comment.timestamp}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}

        <div className="flex gap-3 pt-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">YO</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 gap-2">
            <Textarea
              className="min-h-[60px] resize-none text-sm"
              onChange={(event) => setNewComment(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Add a comment..."
              value={newComment}
            />
            <Button
              className="self-end"
              disabled={!newComment.trim()}
              onClick={handleSubmit}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Draggable Header Component
const DraggableTableHeader = ({ header }: { header: any; table?: any }) => {
  const columnId = header.column.id;
  const isFixedColumn = columnId === "select" || columnId === "actions";

  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({
      id: header.column.id,
      disabled: isFixedColumn,
    });

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
    transform: isFixedColumn ? "none" : CSS.Translate.toString(transform),
    transition: isDragging ? "none" : "transform 0.2s ease",
    whiteSpace: "nowrap",
    width: header.column.getSize(),
    zIndex: isDragging ? 999 : "auto",
  };

  return (
    <TableHead
      key={header.id}
      ref={setNodeRef}
      style={style}
      className={`h-12 relative text-left ${
        isDragging ? "shadow-lg border-2 border-primary" : ""
      }`}
    >
      <div className="flex items-center">
        {!isFixedColumn && (
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

const createColumns = (
  router: { push: (path: string) => void },
  expandedRows: Set<string>,
  toggleRow: (dealId: string) => void,
  rowComments: Record<
    string,
    { comments: Comment[]; hasUnread: boolean; count: number }
  >
): ColumnDef<DealWithRelations>[] => [
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
    id: "loan_number",
    accessorKey: "loan_number",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-1"
        >
          Loan Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-sm font-medium">
        {row.getValue("loan_number") || "—"}
      </div>
    ),
  },
  {
    id: "property_address",
    accessorKey: "property_address",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-1"
        >
          Property Address
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate">
        {row.getValue("property_address") || "No address"}
      </div>
    ),
  },
  {
    id: "project_type",
    accessorKey: "project_type",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-1"
        >
          Project Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const projectType = row.getValue("project_type") as string;
      const displayValue = projectType
        ? projectType
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())
        : "Unknown";

      return <Badge variant="outline">{displayValue}</Badge>;
    },
  },
  {
    id: "deal_stage_2",
    accessorKey: "deal_stage_2",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-1"
        >
          Deal Stage
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const stage = row.getValue("deal_stage_2") as string;
      const displayValue = stage
        ? stage.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
        : "Not Set";

      return (
        <Badge
          variant={
            stage === "closed_and_funded"
              ? "default"
              : stage === "clear_to_close"
                ? "secondary"
                : "outline"
          }
        >
          {displayValue}
        </Badge>
      );
    },
  },
  {
    id: "loan_amount_total",
    accessorKey: "loan_amount_total",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-1"
        >
          Total Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = row.getValue("loan_amount_total") as number;
      return (
        <div>
          {amount
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(amount)
            : "—"}
        </div>
      );
    },
  },
  {
    id: "guarantor_name",
    accessorKey: "guarantor_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-1"
        >
          Guarantor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="max-w-[150px] truncate">
        {row.getValue("guarantor_name") || "No guarantor"}
      </div>
    ),
  },
  {
    id: "comments",
    header: () => <span className="text-sm font-medium">Comments</span>,
    cell: ({ row }) => {
      const dealId = String(row.original.id);
      const isExpanded = expandedRows.has(dealId);
      const commentState = rowComments[dealId];
      const count = commentState?.count ?? 0;
      const hasUnread = commentState?.hasUnread ?? false;
      return (
        <Button
          className={cn("gap-2", hasUnread && "text-primary")}
          onClick={() => toggleRow(dealId)}
          size="sm"
          variant="ghost"
          data-ignore-row-click
        >
          <MessageCircle className="h-4 w-4" />
          <span>{count}</span>
          {hasUnread && <span className="h-2 w-2 rounded-full bg-primary" />}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </Button>
      );
    },
    enableSorting: false,
  },
  {
    id: "funding_date",
    accessorKey: "funding_date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-1"
        >
          Funding Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("funding_date") as string;
      return date ? new Date(date).toLocaleDateString() : "—";
    },
  },
  {
    id: "actions",
    enableHiding: false,
    size: 60,
    cell: ({ row }) => {
      const deal = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push(`/balance-sheet/investor-portfolio/deals/${deal.id}`)}
              >
                <FolderOpenIcon
                  size={16}
                  className="opacity-60"
                  aria-hidden="true"
                />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/balance-sheet/investor-portfolio/deals/${deal.id}`)}
              >
                <BoltIcon size={16} className="opacity-60" aria-hidden="true" />
                Edit
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(deal.id.toString());
                  // Could add toast notification here
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
                <TrashIcon size={16} aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function DealsDataTable({
  onNewDeal,
}: {
  onNewDeal?: () => void
}) {
  const [data, setData] = useState<DealWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [rowComments, setRowComments] = useState<
    Record<string, { comments: Comment[]; hasUnread: boolean; count: number }>
  >({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([
    "select",
    "loan_number",
    "property_address",
    "project_type",
    "deal_stage_2",
    "loan_amount_total",
    "guarantor_name",
    "comments",
    "funding_date",
    "actions",
  ]);

  const loadComments = React.useCallback(
    async (dealId: string, markRead: boolean) => {
      try {
        const res = await fetch(
          `/api/deals/${dealId}/comments?markRead=${markRead ? "1" : "0"}`
        );
        if (!res.ok) return;
        const json = (await res.json()) as {
          comments?: Array<{
            id: string;
            author_name: string;
            author_avatar_url: string | null;
            content: string;
            created_at: string;
          }>;
        };
        const comments = (json.comments ?? []).map((c) => ({
          id: c.id,
          author: c.author_name,
          avatar: c.author_avatar_url ?? "",
          content: c.content,
          timestamp: new Date(c.created_at).toLocaleString(),
        }));
        setRowComments((prev) => {
          return {
            ...prev,
            [dealId]: {
              comments,
              count: comments.length,
              hasUnread: false,
            },
          };
        });
      } catch {
        // ignore
      }
    },
    []
  );

  const addComment = React.useCallback(
    async (dealId: string, content: string) => {
      try {
        const res = await fetch(`/api/deals/${dealId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          comment?: {
            id: string;
            author_name: string;
            author_avatar_url: string | null;
            content: string;
            created_at: string;
          };
        };
        if (!json.comment) return;
        const newComment = {
          id: json.comment.id,
          author: json.comment.author_name,
          avatar: json.comment.author_avatar_url ?? "",
          content: json.comment.content,
          timestamp: "Just now",
        };
        setRowComments((prev) => {
          const existing = prev[dealId] ?? {
            comments: [],
            hasUnread: false,
            count: 0,
          };
          const comments = [...existing.comments, newComment];
          return {
            ...prev,
            [dealId]: {
              comments,
              count: comments.length,
              hasUnread: false,
            },
          };
        });
      } catch {
        // ignore
      }
    },
    []
  );

  const router = useRouter();
  const toggleRow = React.useCallback(
    (dealId: string) => {
      let shouldOpen = false;
      setExpandedRows((prev) => {
        const next = new Set(prev);
        if (next.has(dealId)) {
          next.delete(dealId);
          return next;
        }
        next.add(dealId);
        shouldOpen = true;
        return next;
      });
      if (shouldOpen) {
        void loadComments(dealId, true);
      }
    },
    [loadComments]
  );
  const columns = React.useMemo(
    () => createColumns(router, expandedRows, toggleRow, rowComments),
    [router, expandedRows, rowComments, toggleRow]
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

  // Format column names for display
  function formatColumnName(columnId: string): string {
    const columnNameMap: Record<string, string> = {
      loan_number: "Loan Number",
      property_address: "Property Address",
      project_type: "Project Type",
      deal_stage_2: "Deal Stage",
      loan_amount_total: "Total Amount",
      guarantor_name: "Guarantor",
      funding_date: "Funding Date",
      comments: "Comments",
    };

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
        activeId === "actions" ||
        overId === "select" ||
        overId === "actions"
      ) {
        return;
      }

      setColumnOrder((prev) => {
        const oldIndex = prev.indexOf(activeId);
        const newIndex = prev.indexOf(overId);

        // Create new order but preserve fixed positions
        const newOrder = arrayMove(prev, oldIndex, newIndex);

        // Ensure select is first and actions is last
        const finalOrder = newOrder.filter(
          (id) => id !== "select" && id !== "actions"
        );
        const result = ["select", ...finalOrder, "actions"];

        return result;
      });
    }
  }

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
                  .getColumn("property_address")
                  ?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table
                  .getColumn("property_address")
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
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted">
                  <SortableContext
                    items={columnOrder.filter(
                      (id) => id !== "select" && id !== "actions"
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
                  const commentState = rowComments[dealId] ?? {
                    comments: [],
                    hasUnread: false,
                    count: 0,
                  };
                  return (
                    <React.Fragment key={row.id}>
                      <TableRow
                        className={cn(commentState.hasUnread && "bg-primary/5")}
                        data-state={row.getIsSelected() && "selected"}
                        onClick={(event) => {
                          if (shouldIgnoreRowClick(event.target)) return;
                          toggleRow(dealId);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="text-left">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      {isExpanded ? (
                        <tr>
                          <td className="p-0" colSpan={row.getVisibleCells().length}>
                            <CommentThread
                              comments={commentState.comments}
                              onAddComment={addComment}
                              dealId={dealId}
                            />
                          </td>
                        </tr>
                      ) : null}
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
      </div>
    </DndContext>
  );
}
