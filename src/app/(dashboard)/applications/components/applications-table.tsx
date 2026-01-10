"use client"

import { useId, useMemo, useState } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
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
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from "@/components/ui/pagination"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePagination } from "@/hooks/use-pagination"
import { ApplicationRow } from "../data/fetch-applications"

type AppRow = ApplicationRow & { progress?: number }

interface Props {
  data: ApplicationRow[]
}

export function ApplicationsTable({ data }: Props) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const pageSize = 5
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize })

  const columns = useMemo<ColumnDef<AppRow>[]>(() => {
    return [
      {
        header: "Loan ID",
        accessorKey: "id",
        cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("id") || "-"}</span>,
      },
      {
        header: "Property Address",
        accessorKey: "propertyAddress",
        cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("propertyAddress") || "-"}</span>,
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => <span className="text-sm">{row.getValue("status") || "-"}</span>,
      },
      {
        header: "Progress",
        accessorKey: "progress",
        cell: ({ row }) => {
          const val = (row.original.progress ?? 0) || 0
          return (
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm">{Math.round(val)}%</span>
              <Progress value={val} className="w-40" />
            </div>
          )
        },
      },
      {
        header: "Actions",
        id: "actions",
        cell: () => (
          <Button size="sm" variant="default">
            Start
          </Button>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ]
  }, [])

  const augmentedData = useMemo<AppRow[]>(
    () =>
      data.map((row, idx) => ({
        ...row,
        progress: ((idx + 1) * 17) % 90 + 10, // mock progress 10-99%
      })),
    [data]
  )

  const table = useReactTable({
    data: augmentedData,
    columns,
    state: {
      columnFilters,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
  })

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 2,
  })

  return (
    <div className="w-full border rounded-lg">
      <div className="border-b">
        <div className="flex min-h-17 flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="font-medium">Applications</span>
          <Filter column={table.getColumn("id")!} />
        </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="h-12 border-t">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-muted-foreground first:pl-4 last:pr-4">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="h-14 first:pl-4 last:pr-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No applications yet.
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
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
            {Math.min(
              Math.max(
                table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
                  table.getState().pagination.pageSize,
                0
              ),
              table.getRowCount()
            )}
          </span>{" "}
          of <span>{table.getRowCount().toString()} entries</span>
        </p>

        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  className="disabled:pointer-events-none disabled:opacity-50"
                  variant={"ghost"}
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
                  variant={"ghost"}
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
    </div>
  )
}

function Filter({ column }: { column: any }) {
  const id = useId()
  const columnFilterValue = column.getFilterValue()
  const columnHeader = typeof column.columnDef.header === "string" ? column.columnDef.header : "Search"

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
