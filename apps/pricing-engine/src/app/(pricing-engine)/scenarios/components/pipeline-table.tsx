"use client"

import { useEffect, useState } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  ColumnOrderState,
  RowData,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table"
import { cn } from "@repo/lib/cn"
import { DraggableTableHeader, PINNED_RIGHT_SET, FIXED_COLUMNS } from "@/components/data-table/draggable-table-header"
import { DealsStylePagination } from "@/components/data-table/data-table-pagination"
import { LoanRow } from "../data/fetch-loans"
import { createPipelineColumns, type StarredInput, type AddressInput } from "./pipeline-columns"
import { PipelineToolbar } from "./pipeline-toolbar"
import { Badge } from "@repo/ui/shadcn/badge"
import * as React from "react"
import { Button } from "@repo/ui/shadcn/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/shadcn/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog"
import { Input } from "@repo/ui/shadcn/input"
import { CopyButton } from "@repo/ui/custom/copy-button"
import { ApplicationPartyEditor } from "@/components/application-party-editor"
import { IconDots, IconArchive } from "@tabler/icons-react"
import { CircleCheck, CircleX } from "lucide-react"
import { RoleAssignmentDialog } from "@/components/role-assignment-dialog"
import Link from "next/link"

declare module "@tanstack/react-table" {
   
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string
  }
}

interface Props {
  data: LoanRow[]
  starredInputs: StarredInput[]
  addressInputs: AddressInput[]
}

export function PipelineTable({ data, starredInputs, addressInputs }: Props) {
  const columns = React.useMemo(
    () => createPipelineColumns(starredInputs, addressInputs),
    [starredInputs, addressInputs],
  )
  const [tableData, setTableData] = useState<LoanRow[]>(data)
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
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

  // Persist table "view" (visibility, filters, sorting) across sessions
  const STORAGE_KEY = "pipeline.table.view.v1"
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        visibility?: VisibilityState
        filters?: ColumnFiltersState
        sorting?: SortingState
      }
      if (parsed?.visibility) setColumnVisibility(parsed.visibility)
      if (parsed?.filters) {
        // Strip "archived" from persisted status filter so archived rows
        // don't show unexpectedly on page load
        const cleaned = parsed.filters.map((f) => {
          if (f.id === "status" && Array.isArray(f.value)) {
            return { ...f, value: (f.value as string[]).filter((v) => v !== "archived") }
          }
          return f
        }).filter((f) => !(f.id === "status" && Array.isArray(f.value) && (f.value as string[]).length === 0))
        setColumnFilters(cleaned)
      }
      if (parsed?.sorting) setSorting(parsed.sorting)
    } catch {
      // ignore
    }
     
  }, [])
  useEffect(() => {
    try {
      const payload = JSON.stringify({
        visibility: columnVisibility,
        filters: columnFilters,
        sorting,
      })
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, payload)
      }
    } catch {
      // ignore
    }
  }, [columnVisibility, columnFilters, sorting])

  // Update local table data when a loan's status changes so filters/faceted counts refresh
  useEffect(() => {
    function onStatusUpdated(e: Event) {
      const ce = e as CustomEvent<{ id: string; status: string }>
      const id = ce.detail?.id
      const status = ce.detail?.status
      if (!id || !status) return
      setTableData((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status } as LoanRow : row))
      )
    }
    window.addEventListener("loan-status-updated", onStatusUpdated as EventListener)
    return () =>
      window.removeEventListener("loan-status-updated", onStatusUpdated as EventListener)
  }, [])

  // Update Assigned To when members are changed
  useEffect(() => {
    function onAssigneesUpdated(e: Event) {
      const ce = e as CustomEvent<{ id: string; assignedTo?: string }>
      const id = ce.detail?.id
      if (!id) return
      const assignedTo = ce.detail?.assignedTo ?? ""
      setTableData((prev) =>
        prev.map((row) => (row.id === id ? ({ ...row, assignedTo } as LoanRow) : row))
      )
    }
    window.addEventListener("loan-assignees-updated", onAssigneesUpdated as EventListener)
    return () =>
      window.removeEventListener("loan-assignees-updated", onAssigneesUpdated as EventListener)
  }, [])

  // Hide archived rows unless the user explicitly selects "Archived" in the Status filter
  const statusFilter = columnFilters.find((f) => f.id === "status")
  const statusValues = Array.isArray(statusFilter?.value) ? (statusFilter.value as string[]) : []
  const showArchived = statusValues.includes("archived")
  const visibleData = React.useMemo(
    () => showArchived ? tableData : tableData.filter((row) => row.status !== "archived"),
    [tableData, showArchived]
  )

  const table = useReactTable({
    data: visibleData,
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
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getRowId: (row) => row.id,
  })

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
    <div className="space-y-4 w-full min-w-0 overflow-hidden">
      <PipelineToolbar table={table} />
      {/* Desktop/tablet view */}
      <div className="rounded-md border hidden md:block overflow-x-auto">
        <Table className="min-w-[1000px]">
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => {
                    const isPinned = PINNED_RIGHT_SET.has(cell.column.id)
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "px-3 whitespace-nowrap text-left",
                          cell.column.columnDef.meta?.className ?? "",
                          isPinned && "bg-background group-hover/row:bg-muted/50 !px-1"
                        )}
                        style={
                          isPinned
                            ? { position: "sticky", right: 0, zIndex: 10, boxShadow: "-4px 0 8px -4px rgba(0,0,0,0.08)" }
                            : undefined
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Mobile list view */}
      <div className="md:hidden">
        <div className="space-y-3">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const orig = row.original as LoanRow
              const address = (orig as { propertyAddress?: string }).propertyAddress ?? "-"
              const firstName =
                (orig as { firstName?: string; borrowerFirstName?: string }).firstName ??
                (orig as { firstName?: string; borrowerFirstName?: string }).borrowerFirstName
              const lastName =
                (orig as { lastName?: string; borrowerLastName?: string }).lastName ??
                (orig as { lastName?: string; borrowerLastName?: string }).borrowerLastName
              const borrower = [firstName, lastName].filter(Boolean).join(" ").trim() || "-"
              const status = String((orig as { status?: string }).status ?? "-").toLowerCase()
              const badgeColor = status === "active" 
                ? "bg-success-muted text-success border-success/30"
                : "bg-danger-muted text-danger border-danger/30"
              return (
                <div key={row.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[15px] font-semibold">
                      {orig.id && address !== "-" ? (
                        <Link
                          href={`/pricing?loanId=${encodeURIComponent(orig.id)}`}
                          className="text-primary hover:underline"
                          aria-label={`Open pricing engine for loan ${orig.id}`}
                        >
                          {address}
                        </Link>
                      ) : (
                        address
                      )}
                    </div>
                    <MobileRowActions id={orig.id} status={status} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">
                      <span className="font-medium text-foreground">Borrower</span>: {borrower}
                    </div>
                    <Badge variant="outline" className={cn("capitalize", badgeColor)}>
                      {status || "-"}
                    </Badge>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
              No results.
            </div>
          )}
        </div>
      </div>
      <DealsStylePagination table={table} />
    </div>
    </DndContext>
  )
}

function MobileRowActions({ id, status }: { id: string; status?: string }) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [localStatus, setLocalStatus] = React.useState(status ?? "active")
  const opposite = (localStatus ?? "").toLowerCase() === "active" ? "inactive" : "active"
  const [assignOpen, setAssignOpen] = React.useState(false)
  const [appOpen, setAppOpen] = React.useState(false)
  const [guarantors, setGuarantors] = React.useState<Array<{ id: string | null; name: string; email: string | null }>>([])
  const [entityIds, setEntityIds] = React.useState<string[]>([])
  const [entityName, setEntityName] = React.useState<string | null>(null)
  const [loadingGuarantors, setLoadingGuarantors] = React.useState(false)
  React.useEffect(() => {
    let active = true
    async function load() {
      if (!appOpen) return
      setLoadingGuarantors(true)
      try {
        const res = await fetch(`/api/applications/${id}?loanId=${id}`, { cache: "no-store" })
        const j = (await res.json().catch(() => ({}))) as {
          guarantors?: Array<{ id: string; name: string; email: string | null }>
          entityId?: string | null
          entityName?: string | null
          error?: string
        }
        if (!active) return
        if (res.ok) {
          setGuarantors(j?.guarantors ?? [])
          setEntityIds(j?.entityId ? [j.entityId] : [])
          setEntityName(j?.entityName ?? null)
        } else {
          console.error("applications fetch failed", j?.error ?? res.status)
          setGuarantors([])
          setEntityIds([])
          setEntityName(null)
        }
      } catch {
        if (!active) return
        setGuarantors([])
      } finally {
        if (active) setLoadingGuarantors(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [appOpen, id])

  async function setStatus(next: string) {
    try {
      const res = await fetch(`/api/loans/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) {
        const t = await res.text()
        alert(`Failed to update status: ${t || res.status}`)
        return
      }
      setLocalStatus(next)
      window.dispatchEvent(new CustomEvent("loan-status-updated", { detail: { id, status: next } }))
    } catch {
      alert(`Failed to update status`)
    }
  }

  async function deleteLoan() {
    try {
      const res = await fetch(`/api/loans/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const t = await res.text()
        alert(`Failed to archive: ${t || res.status}`)
        return
      }
      window.location.reload()
    } catch {
      alert(`Failed to archive`)
    }
  }

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <IconDots className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => (window.location.href = `/pricing?loanId=${id}`)}>
            Pricing Engine
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              setAppOpen(true)
            }}
          >
            Application
          </DropdownMenuItem>
          <DropdownMenuItem>Term Sheets</DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              setAssignOpen(true)
            }}
          >
            Assigned To
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setStatus(opposite)} className="gap-2">
            {opposite === "active" ? (
              <CircleCheck className="h-4 w-4 text-success" />
            ) : (
              <CircleX className="h-4 w-4 text-danger" />
            )}
            {`Set to ${opposite}`}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600 gap-2"
            onSelect={(e) => {
              e.preventDefault()
              setConfirmOpen(true)
            }}
          >
            <IconArchive className="h-4 w-4" />
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={appOpen} onOpenChange={setAppOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application</DialogTitle>
            <DialogDescription>Share or send the borrower application link.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Application Link</label>
              <div className="relative flex items-center gap-2">
                <Input readOnly value={`https://apply.whitelabellender.com/${id}`} />
                <CopyButton text={`https://apply.whitelabellender.com/${id}`} />
              </div>
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-medium">E-Sign Request</span>
              <div className="space-y-3">
                {loadingGuarantors ? (
                  <span className="text-sm text-muted-foreground">Loading guarantors…</span>
                ) : (
                  <ApplicationPartyEditor
                    loanId={id}
                    showBorrowerEntity
                    initialEntityId={entityIds[0] ?? null}
                    initialEntityName={entityName ?? undefined}
                    initialGuarantors={guarantors}
                  />
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive loan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive this loan and its primary scenario. It can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                setConfirmOpen(false)
                void deleteLoan()
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <RoleAssignmentDialog
        resourceType="loan"
        resourceId={id}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onSaved={() => {
          window.dispatchEvent(
            new CustomEvent("loan-assignees-updated", { detail: { id } })
          )
        }}
      />
    </div>
  )
}


