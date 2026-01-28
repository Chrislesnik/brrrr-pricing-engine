"use client"

import { useEffect, useState } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { DataTablePagination } from "../../users/components/data-table-pagination"
import { LoanRow } from "../data/fetch-loans"
import { PipelineToolbar } from "./pipeline-toolbar"
import { Badge } from "@/components/ui/badge"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CopyButton } from "@/components/copy-button"
import { ApplicationPartyEditor } from "@/components/application-party-editor"
import { IconDots } from "@tabler/icons-react"
import { Trash2 } from "lucide-react"
import { AssignMembersDialog } from "./assign-members-dialog"
import Link from "next/link"

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string
  }
}

interface Props {
  columns: ColumnDef<LoanRow>[]
  data: LoanRow[]
}

export function PipelineTable({ columns, data }: Props) {
  const [tableData, setTableData] = useState<LoanRow[]>(data)
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

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
      if (parsed?.filters) setColumnFilters(parsed.filters)
      if (parsed?.sorting) setSorting(parsed.sorting)
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    // Use row.id as the stable row identifier to preserve state across data updates
    getRowId: (row) => row.id,
  })

  return (
    <div className="space-y-4">
      <PipelineToolbar table={table} />
      {/* Desktop/tablet view */}
      <div className="rounded-md border hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        "px-3 text-[13px] font-medium text-muted-foreground whitespace-nowrap",
                        header.column.columnDef.meta?.className ?? ""
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "px-3 whitespace-nowrap",
                        cell.column.columnDef.meta?.className ?? ""
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
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
              const badgeColor =
                status === "active"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : status === "dead"
                  ? "bg-red-100 text-red-800 border-red-200"
                  : ""
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
                    <Badge variant="outline" className={`capitalize ${badgeColor}`}>
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
      <DataTablePagination table={table} />
    </div>
  )
}

function MobileRowActions({ id, status }: { id: string; status?: string }) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [localStatus, setLocalStatus] = React.useState(status ?? "active")
  const opposite = (localStatus ?? "").toLowerCase() === "active" ? "dead" : "active"
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
        alert(`Failed to delete: ${t || res.status}`)
        return
      }
      window.location.reload()
    } catch {
      alert(`Failed to delete`)
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
          <DropdownMenuItem onClick={() => setStatus(opposite)}>{`Set to ${opposite}`}</DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onSelect={(e) => {
              e.preventDefault()
              setConfirmOpen(true)
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
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
            <AlertDialogTitle>Delete loan?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this loan and its primary scenario.
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AssignMembersDialog
        loanId={id}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onSaved={() => {}}
      />
    </div>
  )
}


