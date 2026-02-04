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
import { Input } from "@repo/ui/shadcn/input"
import { Label } from "@repo/ui/shadcn/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table"
import { DataTablePagination } from "../../users/components/data-table-pagination"
import { Borrower } from "../data/types"
import { BorrowerRowActions } from "./borrower-row-actions"

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
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  const mon = months[(m || 1) - 1] ?? ""
  return `${String(d).padStart(2, "0")} ${mon}, ${y}`
}

export function BorrowersTable({ data }: { data: BorrowerRow[] }) {
  const pageSize = 10
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })

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
        cell: ({ row }: { row: Row<BorrowerRow> }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.display_id}
          </span>
        ),
      },
      {
        id: "full_name",
        header: "Full Name",
        cell: ({ row }: { row: Row<BorrowerRow> }) => {
          const { first_name, last_name } = row.original
          return (
            <span className="text-foreground font-semibold">{`${first_name} ${last_name}`}</span>
          )
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }: { row: Row<BorrowerRow> }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.email ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "primary_phone",
        header: "Primary Phone",
        cell: ({ row }: { row: Row<BorrowerRow> }) => (
          <span className="text-muted-foreground text-sm">
            {formatPhone(row.original.primary_phone)}
          </span>
        ),
      },
      {
        accessorKey: "date_of_birth",
        header: "Date of Birth",
        cell: ({ row }: { row: Row<BorrowerRow> }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(row.original.date_of_birth)}
          </span>
        ),
      },
      {
        accessorKey: "fico_score",
        header: "FICO",
        cell: ({ row }: { row: Row<BorrowerRow> }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.fico_score ?? "—"}
          </span>
        ),
      },
      {
        id: "assigned_to_names",
        header: "Assigned To",
        cell: ({ row }: { row: Row<BorrowerRow> }) => {
          const names = row.original.assigned_to_names ?? []
          return (
            <span className="text-muted-foreground text-sm">
              {names.length ? names.join(", ") : "—"}
            </span>
          )
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }: { row: Row<BorrowerRow> }) => (
          <BorrowerRowActions borrower={row.original} />
        ),
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
    // Use row.id as the stable row identifier to preserve state across data updates
    getRowId: (row) => row.id,
  })

  const searchColumn = table.getColumn("search")

  return (
    <div className="w-full rounded-lg border">
      <div className="border-b">
        <div className="flex min-h-17 flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="font-medium">Borrowers</span>
          <div className="flex items-center gap-3">
            <Label htmlFor="borrowers-search" className="sr-only">
              Search borrowers
            </Label>
            <Input
              id="borrowers-search"
              placeholder="Search borrowers"
              value={(searchColumn?.getFilterValue() as string) ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                searchColumn?.setFilterValue(e.target.value)
              }
              className="h-9 w-64"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="h-12 border-t">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-muted-foreground first:pl-4 last:pr-4"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: Row<BorrowerRow>) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="h-14 first:pl-4 last:pr-4"
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
                  className="text-muted-foreground h-24 text-center"
                >
                  No borrowers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}
