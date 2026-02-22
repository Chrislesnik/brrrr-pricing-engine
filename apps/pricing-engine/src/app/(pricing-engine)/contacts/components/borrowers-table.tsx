"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  ColumnOrderState,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type Row,
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
import { Checkbox } from "@repo/ui/shadcn/checkbox"
import { Input } from "@repo/ui/shadcn/input"
import { Label } from "@repo/ui/shadcn/label"
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
  const [rowSelection, setRowSelection] = useState({})

  const columns = useMemo<ColumnDef<BorrowerRow>[]>(() => {
    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
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
        id: "row_actions",
        header: "",
        cell: ({ row }: { row: Row<BorrowerRow> }) => (
          <BorrowerRowActions borrower={row.original} />
        ),
        enableSorting: false,
        enableHiding: false,
        meta: { className: "text-right w-10" },
      },
    ]
  }, [])

  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
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

  const table = useReactTable({
    data,
    columns,
    state: { columnFilters, pagination, columnOrder, rowSelection },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
  })

  const searchColumn = table.getColumn("search")

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="w-full">
        <div className="flex min-h-17 flex-wrap items-center justify-between gap-3 py-3">
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
        <div className="rounded-lg border">
        <div className="border-b">
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted">
                    <SortableContext
                      items={table.getAllLeafColumns().map((c) => c.id).filter((id) => !FIXED_COLUMNS.has(id))}
                      strategy={horizontalListSortingStrategy}
                    >
                      {headerGroup.headers.map((header) => (
                        <DraggableTableHeader
                          key={header.id}
                          header={header}
                        />
                      ))}
                    </SortableContext>
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
                      {row.getVisibleCells().map((cell) => {
                        const isPinned = PINNED_RIGHT_SET.has(cell.column.id)
                        const metaClassName = (cell.column.columnDef.meta as Record<string, unknown> | undefined)?.className as string | undefined
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              "h-14 first:pl-4 last:pr-4",
                              isPinned && "bg-background !px-1",
                              metaClassName
                            )}
                            style={
                              isPinned
                                ? {
                                    position: "sticky",
                                    right: 0,
                                    zIndex: 10,
                                    boxShadow:
                                      "-4px 0 8px -4px rgba(0,0,0,0.08)",
                                  }
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
                      className="text-muted-foreground h-24 text-center"
                    >
                      No borrowers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden">
            <div className="space-y-3 p-3">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row: Row<BorrowerRow>) => {
                  const b = row.original
                  const fullName = `${b.first_name} ${b.last_name}`.trim()
                  return (
                    <div key={row.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[15px] font-semibold">{fullName}</div>
                          <div className="text-sm text-muted-foreground">{b.display_id}</div>
                        </div>
                        <BorrowerRowActions borrower={b} />
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <div>{b.email ?? "—"}</div>
                        <div>{formatPhone(b.primary_phone)}</div>
                      </div>
                      {b.fico_score && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">FICO</span>: {b.fico_score}
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                  No borrowers found.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
      <DealsStylePagination table={table} />
      </div>
    </DndContext>
  )
}
