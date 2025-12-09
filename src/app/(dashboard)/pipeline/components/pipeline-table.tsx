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

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className: string
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
  })

  return (
    <div className="space-y-4">
      <PipelineToolbar table={table} />
      {/* Desktop/tablet view */}
      <div className="rounded-md border hidden md:block">
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
                  <div className="text-[15px] font-semibold">{address}</div>
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


