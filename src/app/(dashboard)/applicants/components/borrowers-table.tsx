"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type Row,
} from "@tanstack/react-table"
import { Borrower } from "../data/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { usePagination } from "@/hooks/use-pagination"
import { BorrowerRowActions } from "./borrower-row-actions"
import { ChevronLeft, ChevronRight } from "lucide-react"

type BorrowerRow = Borrower

function formatPhone(input: string | null | undefined): string {
  const raw = (input ?? "").toString()
  const digits = raw.replace(/\D+/g, "")
  if (!digits) return "-"
  let cc = ""
  let national = ""
  if (digits.length === 11 && digits.startsWith("1")) {
    cc = "+1"
    national = digits.slice(1)
  } else if (digits.length === 10) {
    cc = "+1"
    national = digits
  } else {
    return raw
  }
  const a = national.slice(0, 3)
  const b = national.slice(3, 6)
  const c = national.slice(6, 10)
  return `${cc} (${a}) ${b}-${c}`
}

function formatDate(ymd: string | null | undefined): string {
  const s = (ymd ?? "").toString()
  if (!/^[0-9]{4}-\d{2}-\d{2}$/.test(s)) return "-"
  const [y, m, d] = s.split("-").map((p) => Number(p))
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const mon = months[(m || 1) - 1] ?? ""
  return `${String(d).padStart(2, "0")} ${mon}, ${y}`
}

export function BorrowersTable({ data }: { data: BorrowerRow[] }) {
  const pageSize = 10
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize })

  const columns = useMemo<ColumnDef<BorrowerRow>[]>(() => {
    return [
      {
        id: "search",
        accessorFn: (row: BorrowerRow) =>
          `${row.display_id} ${row.first_name} ${row.last_name} ${row.email ?? ""} ${row.primary_phone ?? ""} ${row.alt_phone ?? ""}`.toLowerCase(),
        header: () => null,
        cell: () => null,
        enableSorting: false,
        enableHiding: true,
        meta: { className: "hidden" },
      },
      {
        accessorKey: "display_id",
        header: "ID",
        cell: ({ row }: { row: Row<BorrowerRow> }) => <span className="text-sm text-muted-foreground">{row.original.display_id}</span>,
      },
      {
        id: "full_name",
        header: "Full Name",
        cell: ({ row }: { row: Row<BorrowerRow> }) => {
          const { first_name, last_name } = row.original
          return <span className="font-semibold text-foreground">{`${first_name} ${last_name}`}</span>
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }: { row: Row<BorrowerRow> }) => <span className="text-sm text-muted-foreground">{row.original.email ?? "—"}</span>,
      },
      {
        accessorKey: "primary_phone",
        header: "Primary Phone",
        cell: ({ row }: { row: Row<BorrowerRow> }) => <span className="text-sm text-muted-foreground">{formatPhone(row.original.primary_phone)}</span>,
      },
      {
        accessorKey: "date_of_birth",
        header: "Date of Birth",
        cell: ({ row }: { row: Row<BorrowerRow> }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.date_of_birth)}</span>,
      },
      {
        accessorKey: "fico_score",
        header: "FICO",
        cell: ({ row }: { row: Row<BorrowerRow> }) => <span className="text-sm text-muted-foreground">{row.original.fico_score ?? "—"}</span>,
      },
      {
        id: "assigned_to_names",
        header: "Assigned To",
        cell: ({ row }: { row: Row<BorrowerRow> }) => {
          const names = row.original.assigned_to_names ?? []
          return <span className="text-sm text-muted-foreground">{names.length ? names.join(", ") : "—"}</span>
        },
      },
        {
          id: "actions",
          header: "",
          cell: ({ row }: { row: Row<BorrowerRow> }) => <BorrowerRowActions borrower={row.original} />,
          meta: { className: "text-right w-10" },
        },
    ]
  }, [])

  const table = useReactTable({
    data,
    columns,
    state: { columnFilters, pagination },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const filteredCount = table.getFilteredRowModel().rows.length
  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 2,
  })

  const searchColumn = table.getColumn("search")

  return (
    <div className="w-full rounded-lg border bg-background">
      <div className="border-b">
        <div className="flex min-h-[56px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Label htmlFor="borrowers-search" className="sr-only">
              Search borrowers
            </Label>
            <Input
              id="borrowers-search"
              placeholder="Search borrowers"
              value={(searchColumn?.getFilterValue() as string) ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => searchColumn?.setFilterValue(e.target.value)}
              className="h-9 w-64"
            />
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-auto">
        <Table className="w-full caption-bottom text-sm">
          <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="[&_th]:text-xs [&_th]:uppercase [&_th]:text-muted-foreground">
              {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={cn(header.column.columnDef.meta?.className)}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: Row<BorrowerRow>) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="border-b transition-colors hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cn(cell.column.columnDef.meta?.className)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No borrowers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-4 max-sm:flex-col md:max-lg:flex-col">
        <p className="text-muted-foreground text-sm whitespace-nowrap" aria-live="polite">
          Showing{" "}
          <span>
            {filteredCount === 0
              ? 0
              : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}{" "}
            to{" "}
            {Math.min(
              table.getState().pagination.pageIndex * table.getState().pagination.pageSize + table.getState().pagination.pageSize,
              filteredCount
            )}
          </span>{" "}
          of <span>{filteredCount}</span> entries
        </p>
        <Pagination className="w-full justify-end">
          <PaginationContent>
            <PaginationItem>
              <Button
                className="disabled:pointer-events-none disabled:opacity-50"
                variant="ghost"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to previous page"
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                Previous
              </Button>
            </PaginationItem>

            {showLeftEllipsis && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {pages.map((page) => {
              const isActive = page === table.getState().pagination.pageIndex + 1
              return (
                <PaginationItem key={page}>
                  <Button
                    size="icon"
                    className={!isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : ""}
                    onClick={() => table.setPageIndex(page - 1)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {page}
                  </Button>
                </PaginationItem>
              )
            })}

            {showRightEllipsis && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            <PaginationItem>
              <Button
                className="disabled:pointer-events-none disabled:opacity-50"
                variant="ghost"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to next page"
              >
                Next
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
