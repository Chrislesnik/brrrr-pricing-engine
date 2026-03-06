"use client"

import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ColumnDef,
  ColumnFiltersState,
  ColumnOrderState,
  PaginationState,
  RowSelectionState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { ChevronDown, Download, Plus, Settings2 } from "lucide-react"
import { cn } from "@repo/lib/cn"
import MultiStepForm from "@/components/shadcn-studio/blocks/multi-step-form-03/MultiStepForm"
import { Button } from "@repo/ui/shadcn/button"
import { Checkbox } from "@repo/ui/shadcn/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/ui/shadcn/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu"
import { Separator } from "@repo/ui/shadcn/separator"
import { Input } from "@repo/ui/shadcn/input"
import { Label } from "@repo/ui/shadcn/label"
import { Progress } from "@repo/ui/shadcn/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table"
import { ApplicationPartyEditor } from "@/components/application-party-editor"
import { DataGridFilterMenu } from "@/components/data-grid/data-grid-filter-menu"
import { DraggableTableHeader, PINNED_RIGHT_SET, FIXED_COLUMNS } from "@/components/data-table/draggable-table-header"
import { TableDisplaySettings } from "@/components/data-table/table-display-settings"
import { DealsStylePagination } from "@/components/data-table/data-table-pagination"
import { ApplicationRow } from "../data/fetch-applications"

type AppRow = ApplicationRow & { progress?: number }

interface Props {
  data: ApplicationRow[]
}

export function ApplicationsTable({ data }: Props) {
  const router = useRouter()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    displayId: false, // Loan ID hidden by default
  })
  const pageSize = 10
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [linkedRows, setLinkedRows] = useState<Record<string, boolean>>({})
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [downloadContext, setDownloadContext] = useState<{
    id: string
    borrower?: string | null
    entityId?: string | null
    documensoDocumentId?: string | null
    guarantors?: Array<{ id: string; name: string; email: string | null }> | null
    status?: string | null
    signingProgressPct?: number
  } | null>(null)
  const [liveData, setLiveData] = useState<
    Record<
      string,
      Pick<AppRow, "signingProgressPct" | "signingSigned" | "signingTotal">
    >
  >({})
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const poll = async () => {
      try {
        const res = await fetch("/api/applications/progress", {
          cache: "no-store",
          signal: controller.signal,
        })
        if (!res.ok) return
        const j = (await res.json().catch(() => ({}))) as {
          rows?: Array<{
            loan_id: string
            signingProgressPct?: number
            signingSigned?: number
            signingTotal?: number
          }>
        }
        if (Array.isArray(j?.rows)) {
          const next: Record<
            string,
            Pick<
              AppRow,
              "signingProgressPct" | "signingSigned" | "signingTotal"
            >
          > = {}
          j.rows.forEach((r) => {
            next[r.loan_id] = {
              signingProgressPct: r.signingProgressPct ?? 0,
              signingSigned: r.signingSigned ?? 0,
              signingTotal: r.signingTotal ?? 0,
            }
          })
          setLiveData(next)
        }
      } catch {
        // ignore fetch errors
      }
    }

    // initial load
    poll()
    pollRef.current = setInterval(poll, 5000)

    return () => {
      controller.abort()
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const toggleRow = (rowId: string) =>
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }))

  const _toggleLinked = (rowId: string) =>
    setLinkedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }))

  const columns = useMemo<ColumnDef<AppRow>[]>(() => {
    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        meta: { className: "w-10 pl-3" },
      },
      {
        id: "expand",
        header: "",
        cell: ({ row }) => {
          const isOpen = !!expandedRows[row.id]
          return (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => toggleRow(row.id)}
              aria-label={isOpen ? "Collapse row" : "Expand row"}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOpen ? "rotate-180" : "-rotate-90"
                )}
                aria-hidden="true"
              />
            </Button>
          )
        },
        enableSorting: false,
        enableHiding: false,
        meta: { className: "w-12 pl-3" },
      },
      {
        id: "search",
        accessorFn: (row) =>
          `${row.id ?? ""} ${row.propertyAddress ?? ""} ${row.borrowerEntityName ?? ""}`.toLowerCase(),
        header: () => null,
        cell: () => null,
        enableSorting: false,
        enableHiding: true,
        filterFn: (row, columnId, filterValue) => {
          const value = (row.getValue<string>(columnId) ?? "").toString()
          const q = (filterValue ?? "").toString().toLowerCase().trim()
          if (!q) return true
          return value.includes(q)
        },
        meta: { className: "hidden" },
      },
      {
        header: "Application ID",
        accessorKey: "appDisplayId",
        meta: { className: "w-[14%]" },
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.getValue("appDisplayId") || "-"}
          </span>
        ),
      },
      {
        header: "Loan ID",
        accessorKey: "displayId",
        meta: { className: "w-[14%]" },
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.getValue("displayId") || "-"}
          </span>
        ),
      },
      {
        header: "Property Address",
        accessorKey: "propertyAddress",
        meta: { className: "w-[32%]" },
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.getValue("propertyAddress") || "-"}
          </span>
        ),
      },
      {
        id: "status",
        header: ({ column }) => (
          <StatusFilterMenu
            label="Status"
            options={[
              { id: "draft", label: "Draft" },
              { id: "pending", label: "Pending" },
              { id: "received", label: "Received" },
            ]}
            selected={statusFilter}
            onChange={(next) => {
              setStatusFilter(next)
              column.setFilterValue(next)
            }}
          />
        ),
        accessorFn: (row) => {
          const val = row.progress ?? 0
          const normalized = Math.max(0, Math.min(100, val))
          return normalized >= 100
            ? "received"
            : normalized > 0
              ? "pending"
              : "draft"
        },
        cell: ({ getValue }) => {
          const derivedStatus = (getValue() as string) ?? "draft"
          const badgeClasses: Record<string, string> = {
            draft: "bg-gray-100 text-gray-700 border-transparent",
            pending: "bg-amber-100 text-amber-700 border-transparent",
            received: "bg-green-100 text-green-700 border-transparent",
            default: "bg-muted text-muted-foreground border-transparent",
          }
          return (
            <span
              className={cn(
                "inline-flex min-w-[70px] items-center justify-center rounded-lg px-2.5 py-1 text-xs font-semibold capitalize",
                badgeClasses[derivedStatus] || badgeClasses.default
              )}
            >
              {derivedStatus}
            </span>
          )
        },
        filterFn: (row, columnId, filterValue) => {
          const val = (row.getValue<string>(columnId) ?? "")
            .toString()
            .toLowerCase()
          const arr = Array.isArray(filterValue) ? filterValue : []
          if (!arr.length) return true
          return arr.includes(val)
        },
      },
      {
        header: "Progress",
        accessorKey: "progress",
        meta: { className: "w-[18%]" },
        cell: ({ row }) => {
          const signed = row.original.signingSigned ?? 0
          const total = row.original.signingTotal ?? 0
          const val = (row.original.progress ?? 0) || 0
          return (
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm">
                {Math.round(val)}% {total > 0 ? `(${signed}/${total})` : ""}
              </span>
              <Progress
                value={val}
                className="w-40"
                indicatorClassName={
                  val >= 100
                    ? "bg-success"
                    : val > 0
                      ? "bg-warning"
                      : undefined
                }
              />
            </div>
          )
        },
      },
      {
        header: () => <div className="w-full text-center">Actions</div>,
        id: "row_actions",
        cell: ({ row }) => (
          <div className="flex w-full items-center justify-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9"
              aria-label="Download documents"
              onClick={(e) => {
                e.stopPropagation()
                setDownloadContext({
                  id: row.id,
                  borrower: row.original.borrowerEntityName,
                  entityId: row.original.entityId,
                  documensoDocumentId: row.original.documensoDocumentId,
                  guarantors: row.original.guarantors,
                  status: row.original.status,
                  signingProgressPct: row.original.signingProgressPct,
                })
              }}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              size="sm"
              variant="default"
              className="min-w-[90px]"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/applications/${row.original.id}`)
              }}
            >
              Start
            </Button>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ]
  }, [expandedRows, linkedRows, statusFilter])

  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, {})
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      const activeId = active.id as string
      const overId = over.id as string
      if (FIXED_COLUMNS.has(activeId) || FIXED_COLUMNS.has(overId)) return
      const currentOrder = table.getAllLeafColumns().map((c) => c.id)
      const oldIndex = currentOrder.indexOf(activeId)
      const newIndex = currentOrder.indexOf(overId)
      if (oldIndex === -1 || newIndex === -1) return
      setColumnOrder(arrayMove(currentOrder, oldIndex, newIndex))
    }
  }

  const augmentedData = useMemo<AppRow[]>(
    () =>
      data.map((row) => {
        const live = liveData[row.id]
        const progressPct =
          live?.signingProgressPct ?? row.signingProgressPct ?? 0
        const signed = live?.signingSigned ?? row.signingSigned ?? 0
        const total = live?.signingTotal ?? row.signingTotal ?? 0
        return {
          ...row,
          signingProgressPct: progressPct,
          signingSigned: signed,
          signingTotal: total,
          progress: Math.max(0, Math.min(100, Math.round(progressPct * 100))),
        }
      }),
    [data, liveData]
  )

  // Keep pagination in bounds when data changes
  const totalPages = Math.ceil(augmentedData.length / pageSize)
  useEffect(() => {
    if (pagination.pageIndex >= totalPages && totalPages > 0) {
      setPagination((prev) => ({ ...prev, pageIndex: totalPages - 1 }))
    }
  }, [totalPages, pagination.pageIndex, pageSize])

  const table = useReactTable({
    data: augmentedData,
    columns,
    state: {
      columnFilters,
      columnVisibility,
      columnOrder,
      rowSelection,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    // Prevent automatic page reset when data changes (e.g., from polling)
    autoResetPageIndex: false,
    // Use row.id as the stable row identifier to preserve state across data updates
    getRowId: (row) => row.id,
  })

  return (
    <DndContext collisionDetection={closestCenter} modifiers={[restrictToHorizontalAxis]} onDragEnd={handleDragEnd} sensors={sensors}>
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          <Filter column={table.getColumn("search")!} />
        </div>
        <div className="flex items-center gap-3">
          <DataGridFilterMenu table={table} align="end" />
          <TableDisplaySettings table={table} formatColumnName={formatColumnName} />
          <Button onClick={() => router.push("/applications/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Application
          </Button>
        </div>
      </div>
      {/* Desktop table */}
      <div className="rounded-md border hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="h-12 border-t bg-muted">
                  <SortableContext items={table.getAllLeafColumns().map((c) => c.id).filter((id) => !FIXED_COLUMNS.has(id))} strategy={horizontalListSortingStrategy}>
                    {headerGroup.headers.map((header) => (
                      <DraggableTableHeader key={header.id} header={header} />
                    ))}
                  </SortableContext>
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const isOpen = !!expandedRows[row.id]
                  return (
                    <Fragment key={row.id}>
                      <TableRow
                        data-state={row.getIsSelected() && "selected"}
                        className="cursor-pointer"
                        onClick={(e) => {
                          const interactive = (e.target as HTMLElement).closest(
                            "button, a, input, select, textarea"
                          )
                          if (interactive) return
                          toggleRow(row.id)
                        }}
                        aria-expanded={isOpen}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const isPinned = PINNED_RIGHT_SET.has(cell.column.id)
                          const metaClassName = (cell.column.columnDef.meta as Record<string, unknown> | undefined)?.className as string | undefined
                          return (
                            <TableCell
                              key={cell.id}
                              className={cn("h-14 px-3", isPinned && "bg-background group-hover/row:bg-transparent !px-1", metaClassName)}
                              style={isPinned ? { position: "sticky", right: 0, zIndex: 10, boxShadow: "-4px 0 8px -4px rgba(0,0,0,0.08)" } : undefined}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                      <TableRow
                        className={cn(
                          "bg-muted/30 border-0",
                          !isOpen && "border-0"
                        )}
                      >
                        <TableCell colSpan={columns.length} className="p-0">
                          <div
                            className="grid transition-[grid-template-rows] duration-200 ease-out"
                            style={{
                              gridTemplateRows: isOpen ? "1fr" : "0fr",
                            }}
                          >
                            <div className="overflow-hidden">
                              <div className="p-4">
                                <ApplicationPartyEditor
                                  loanId={row.original.id}
                                  showBorrowerEntity={
                                    row.original.showBorrowerEntity
                                  }
                                  initialEntityId={row.original.entityId}
                                  initialEntityName={
                                    row.original.borrowerEntityName ?? undefined
                                  }
                                  initialGuarantors={
                                    row.original.guarantors ?? []
                                  }
                                  initialSignedEmails={
                                    row.original.signedEmails ?? []
                                  }
                                  initialSentEmails={
                                    row.original.sentEmails ?? []
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-muted-foreground h-24 text-center"
                  >
                    No applications yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden rounded-md border">
        <div className="space-y-3 p-3">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const app = row.original
                const progressVal = app.progress ?? 0
                const derivedStatus =
                  progressVal >= 100
                    ? "received"
                    : progressVal > 0
                      ? "pending"
                      : "draft"
                const badgeClasses: Record<string, string> = {
                  draft: "bg-gray-100 text-gray-700 border-transparent",
                  pending: "bg-amber-100 text-amber-700 border-transparent",
                  received: "bg-green-100 text-green-700 border-transparent",
                }
                return (
                  <div key={row.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-semibold">
                          {app.appDisplayId || app.id.slice(0, 12)}
                        </div>
                        <div className="mt-0.5 truncate text-sm text-muted-foreground">
                          {app.propertyAddress || "—"}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-lg px-2.5 py-1 text-xs font-semibold capitalize",
                          badgeClasses[derivedStatus] ?? badgeClasses.draft
                        )}
                      >
                        {derivedStatus}
                      </span>
                    </div>
                    {app.displayId && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Loan: {app.displayId}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {Math.round(progressVal)}%
                      </span>
                      <Progress
                        value={progressVal}
                        className="flex-1"
                        indicatorClassName={
                          progressVal >= 100
                            ? "bg-success"
                            : progressVal > 0
                              ? "bg-warning"
                              : undefined
                        }
                      />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9"
                        aria-label="Download documents"
                        onClick={() =>
                          setDownloadContext({
                            id: row.id,
                            borrower: app.borrowerEntityName,
                            entityId: app.entityId,
                            documensoDocumentId: app.documensoDocumentId,
                            guarantors: app.guarantors,
                            status: app.status,
                            signingProgressPct: app.signingProgressPct,
                          })
                        }
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => router.push(`/applications/${app.id}`)}
                      >
                        Start
                      </Button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                No applications yet.
              </div>
            )}
          </div>
      </div>
      <DealsStylePagination table={table} />
      <Dialog
        open={!!downloadContext}
        onOpenChange={(open) => {
          if (!open) setDownloadContext(null)
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Download Application</DialogTitle>
            <DialogDescription>
              {downloadContext?.borrower
                ? `Download documents for ${downloadContext.borrower}.`
                : "Download documents for this application."}
            </DialogDescription>
          </DialogHeader>
          {downloadContext && (
            <DownloadDialogBody
              loanId={downloadContext.id}
              entityId={downloadContext.entityId}
              documensoDocumentId={downloadContext.documensoDocumentId}
              guarantors={downloadContext.guarantors}
              isCompleted={downloadContext.signingProgressPct != null && downloadContext.signingProgressPct >= 1}
            />
          )}
        </DialogContent>
      </Dialog>
      <style jsx global>{`
        @keyframes email-shake {
          0% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-4px);
          }
          40% {
            transform: translateX(4px);
          }
          60% {
            transform: translateX(-3px);
          }
          80% {
            transform: translateX(3px);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
    </DndContext>
  )
}

function Filter({ column }: { column: any }) {
  const id = useId()
  const columnFilterValue = column.getFilterValue()
  const columnHeader =
    typeof column.columnDef.header === "string"
      ? column.columnDef.header
      : "Search"

  return (
    <div>
      <Label htmlFor={`${id}-input`} className="sr-only">
        {columnHeader}
      </Label>
      <Input
        id={`${id}-input`}
        value={(columnFilterValue ?? "") as string}
        onChange={(e) => column.setFilterValue(e.target.value)}
        placeholder={`Search applications`}
        type="text"
      />
    </div>
  )
}

interface StatusFilterMenuProps {
  label: string
  options: Array<{ id: string; label: string }>
  selected: string[]
  onChange: (next: string[]) => void
}

function StatusFilterMenu({
  label,
  options,
  selected,
  onChange,
}: StatusFilterMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="data-[state=open]:bg-muted/80 text-muted-foreground flex h-9 items-center gap-2 px-2 text-sm font-medium"
        >
          <span>{label}</span>
          <ChevronDown className="h-4 w-4 opacity-70" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 p-0">
        <Command loop>
          <CommandInput placeholder={label} className="h-9" />
          <CommandList>
            <CommandEmpty className="text-muted-foreground px-3 py-2 text-xs">
              No status found.
            </CommandEmpty>
            <CommandGroup className="p-1">
              {options.map((opt) => {
                const checked = selected.includes(opt.id)
                return (
                  <CommandItem
                    key={opt.id}
                    value={opt.label}
                    onSelect={() => {
                      const next = new Set(selected)
                      if (checked) next.delete(opt.id)
                      else next.add(opt.id)
                      onChange(Array.from(next))
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={checked} className="h-4 w-4" />
                      <span className="capitalize">{opt.label}</span>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selected.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup className="p-1">
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="text-muted-foreground text-xs"
                  >
                    Clear all
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function formatColumnName(columnId: string): string {
  const map: Record<string, string> = {
    appDisplayId: "Application ID",
    displayId: "Loan ID",
    propertyAddress: "Property Address",
    status: "Status",
    progress: "Progress",
  }
  return map[columnId] ?? columnId.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())
}

interface DownloadDialogBodyProps {
  loanId: string
  entityId?: string | null
  documensoDocumentId?: string | null
  guarantors?: Array<{ id: string; name: string; email: string | null }> | null
  isCompleted: boolean
}

function DownloadDialogBody({ loanId, entityId, documensoDocumentId, guarantors, isCompleted }: DownloadDialogBodyProps) {
  const visibleGuarantors = (guarantors ?? []).slice(0, 4)
  const hasEntity = !!entityId
  const [downloading, setDownloading] = useState(false)

  const [sections, setSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    if (hasEntity) init.entity = true
    visibleGuarantors.forEach((_, i) => { init[`guarantor${i + 1}`] = true })
    init.property = true
    init.loan = true
    return init
  })

  const allKeys = Object.keys(sections)
  const allChecked = allKeys.length > 0 && allKeys.every((k) => sections[k])
  const someChecked = allKeys.some((k) => sections[k])

  const toggleAll = () => {
    const next = !allChecked
    setSections((prev) => {
      const updated = { ...prev }
      for (const k of Object.keys(updated)) updated[k] = next
      return updated
    })
  }

  const toggle = (key: string) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleDownloadCompleted = async () => {
    if (!documensoDocumentId) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/applications/${loanId}/download`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as any).error || "Download failed")
      }
      const blob = await res.blob()
      const disposition = res.headers.get("Content-Disposition")
      const filenameMatch = disposition?.match(/filename="(.+?)"/)
      const filename = filenameMatch?.[1] ?? "application-signed.pdf"

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Download completed document error:", err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Completed document */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Completed Document</p>
        <Button
          className="w-full"
          disabled={!isCompleted || !documensoDocumentId || downloading}
          onClick={handleDownloadCompleted}
        >
          <Download className="mr-2 h-4 w-4" />
          {downloading ? "Downloading..." : "Download Completed Document"}
        </Button>
        {!isCompleted && (
          <p className="text-xs text-muted-foreground">
            Available once all parties have signed.
          </p>
        )}
      </div>

      <Separator />

      {/* Unsigned version */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Download Unsigned Version</p>

        <div className="space-y-2 rounded-md border p-3">
          {/* Select / Deselect All */}
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={allChecked || (someChecked && "indeterminate")}
              onCheckedChange={toggleAll}
            />
            <span className="text-sm font-medium">Select / Deselect All</span>
          </label>

          <Separator className="my-1" />

          {hasEntity && (
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={!!sections.entity}
                onCheckedChange={() => toggle("entity")}
              />
              <span className="text-sm">With entity information</span>
            </label>
          )}

          {visibleGuarantors.map((g, i) => (
            <label key={g.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={!!sections[`guarantor${i + 1}`]}
                onCheckedChange={() => toggle(`guarantor${i + 1}`)}
              />
              <span className="text-sm">
                With guarantor {i + 1} information{g.name ? ` (${g.name})` : ""}
              </span>
            </label>
          ))}

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={!!sections.property}
              onCheckedChange={() => toggle("property")}
            />
            <span className="text-sm">With property information</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={!!sections.loan}
              onCheckedChange={() => toggle("loan")}
            />
            <span className="text-sm">With loan information</span>
          </label>
        </div>

        <Button
          className="w-full"
          variant="outline"
          onClick={() => {
            const selected = Object.entries(sections)
              .filter(([, v]) => v)
              .map(([k]) => k)
            // TODO: call download unsigned document API with selected sections
            console.log("Download unsigned version with sections:", selected)
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Unsigned Version
        </Button>
      </div>
    </div>
  )
}

interface StartModalProps {
  row: AppRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function StartModal({ row, open, onOpenChange }: StartModalProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [open])

  if (!row) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90vh] w-[75vw] max-w-[1100px] border-none p-0 shadow-2xl sm:max-w-[1200px]">
        <DialogTitle className="sr-only">Application workflow</DialogTitle>
        <div ref={scrollRef} className="h-full overflow-hidden">
          <MultiStepForm
            entityName={row.borrowerEntityName}
            guarantors={row.guarantors ?? undefined}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
