"use client"

import { Fragment, useMemo, useState } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  ColumnOrderState,
  PaginationState,
  RowData,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  VisibilityState,
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
import { ChevronDown, Columns2, Search } from "lucide-react"
import { cn } from "@repo/lib/cn"
import { Button } from "@repo/ui/shadcn/button"
import { Checkbox } from "@repo/ui/shadcn/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu"
import { Input } from "@repo/ui/shadcn/input"
import { Label } from "@repo/ui/shadcn/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table"
import { DraggableTableHeader, PINNED_RIGHT_SET, FIXED_COLUMNS } from "@/components/data-table/draggable-table-header"
import { DealsStylePagination } from "@/components/data-table/data-table-pagination"

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string
  }
}

import type {
  BrokerIndividualRow,
  MemberOrgRow,
} from "../data/fetch-broker-individuals"

interface Props {
  data: BrokerIndividualRow[]
  initialOrgsMap?: Record<string, MemberOrgRow[]>
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "-"
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return "-"
  }
}

function formatRole(role: string | null | undefined) {
  if (!role) return "-"
  return role.replace(/^org:/, "").replace(/_/g, " ")
}

export function BrokerIndividualsTable({ data, initialOrgsMap }: Props) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const pageSize = 10
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })
  const [rowSelection, setRowSelection] = useState({})
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [orgsMap, setOrgsMap] = useState<
    Record<string, MemberOrgRow[] | null | undefined>
  >(initialOrgsMap ?? {})
  const [orgsLoading, setOrgsLoading] = useState<Record<string, boolean>>({})

  const fetchOrgs = async (memberId: string) => {
    if (orgsMap[memberId] !== undefined || orgsLoading[memberId]) return
    setOrgsLoading((prev) => ({ ...prev, [memberId]: true }))
    try {
      const res = await fetch(
        `/api/brokers/individuals/${encodeURIComponent(memberId)}/organizations`,
        { cache: "no-store" }
      )
      if (!res.ok) {
        setOrgsMap((prev) => ({ ...prev, [memberId]: null }))
        return
      }
      const j = (await res.json().catch(() => ({}))) as {
        organizations?: MemberOrgRow[]
      }
      setOrgsMap((prev) => ({
        ...prev,
        [memberId]: Array.isArray(j.organizations) ? j.organizations : [],
      }))
    } catch {
      setOrgsMap((prev) => ({ ...prev, [memberId]: null }))
    } finally {
      setOrgsLoading((prev) => ({ ...prev, [memberId]: false }))
    }
  }

  const isAnyDialogOpen = () =>
    typeof document !== "undefined" &&
    document.querySelector("[data-slot='dialog-content'][data-state='open']")

  const toggleRow = (rowId: string, memberId: string) => {
    if (isAnyDialogOpen()) return
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }))
    fetchOrgs(memberId)
  }

  const columns = useMemo<ColumnDef<BrokerIndividualRow>[]>(() => {
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
              onClick={() => toggleRow(row.id, row.original.id)}
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
        header: "Name",
        accessorKey: "last_name",
        cell: ({ row }) => {
          const name = [row.original.first_name, row.original.last_name]
            .filter(Boolean)
            .join(" ")
          return (
            <span className="text-foreground text-sm font-semibold">
              {name || "-"}
            </span>
          )
        },
        filterFn: (row, _columnId, value) => {
          const term = String(value ?? "")
            .toLowerCase()
            .trim()
          if (!term) return true
          const haystack = [
            row.original.first_name ?? "",
            row.original.last_name ?? "",
            row.original.user_id ?? "",
          ]
            .join(" ")
            .toLowerCase()
          return haystack.includes(term)
        },
      },
      {
        header: "Org Role",
        accessorKey: "clerk_org_role",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm capitalize">
            {formatRole(row.original.clerk_org_role)}
          </span>
        ),
      },
      {
        header: "Member Role",
        accessorKey: "clerk_member_role",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm capitalize">
            {formatRole(row.original.clerk_member_role)}
          </span>
        ),
      },
      {
        header: "Organizations",
        accessorKey: "org_count",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.org_count}
          </span>
        ),
      },
      {
        header: "Joined",
        accessorKey: "created_at",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
    ]
  }, [expandedRows])

  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, {})
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      columnVisibility,
      pagination,
      columnOrder,
      rowSelection,
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getRowId: (row) => row.id,
  })

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
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search individuals..."
              value={(table.getColumn("last_name")?.getFilterValue() as string) ?? ""}
              onChange={(e) => table.getColumn("last_name")?.setFilterValue(e.target.value)}
              className="pl-8 max-w-sm"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 bg-background">
                <Columns2 className="w-4 h-4 mr-2" />
                <span className="text-xs font-medium">Customize Columns</span>
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(value) => col.toggleVisibility(!!value)}
                  >
                    {col.id.replace(/([A-Z_])/g, " $1").replace(/_/g, " ").replace(/^./, (s) => s.toUpperCase()).trim()}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border overflow-x-auto">
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
                  const memberId = row.original.id
                  return (
                    <Fragment key={row.id}>
                      <TableRow
                        data-state={row.getIsSelected() && "selected"}
                        className="cursor-pointer"
                        onClick={(e) => {
                          if (isAnyDialogOpen()) return
                          const interactive = (
                            e.target as HTMLElement
                          ).closest(
                            "button, a, input, select, textarea, [role='menuitem'], [role='menu'], [data-radix-popper-content]"
                          )
                          if (interactive) return
                          toggleRow(row.id, memberId)
                        }}
                        aria-expanded={isOpen}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const isPinned = PINNED_RIGHT_SET.has(cell.column.id)
                          return (
                            <TableCell
                              key={cell.id}
                              className={cn(
                                "h-14 first:pl-4 last:pr-4",
                                cell.column.columnDef.meta?.className ?? "",
                                isPinned && "bg-background !px-1"
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
                      <TableRow className="bg-muted/30 border-0">
                        <TableCell colSpan={columns.length} className="p-0">
                          <div
                            className="grid transition-[grid-template-rows] duration-200 ease-out"
                            style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                          >
                            <div className="overflow-hidden">
                              {orgsLoading[memberId] &&
                              orgsMap[memberId] === undefined ? (
                                <div className="text-muted-foreground p-4 text-sm">
                                  Loading organizations...
                                </div>
                              ) : orgsMap[memberId] == null ? (
                                <div className="text-destructive p-4 text-sm">
                                  Failed to load organizations.
                                </div>
                              ) : (orgsMap[memberId]?.length ?? 0) === 0 ? (
                                <div className="text-muted-foreground p-4 text-sm">
                                  No organizations linked.
                                </div>
                              ) : (
                                <div>
                                  <div className="text-muted-foreground grid grid-cols-5 gap-4 px-6 py-2 text-[11px] font-semibold uppercase">
                                    <span>Organization</span>
                                    <span>Slug</span>
                                    <span>Members</span>
                                    <span>Date Added</span>
                                    <span />
                                  </div>
                                  {orgsMap[memberId]?.map((org) => (
                                    <div
                                      key={org.id}
                                      className="grid grid-cols-5 items-center gap-4 px-6 py-2 text-sm"
                                    >
                                      <div className="flex items-center">
                                        <span className="text-muted-foreground mr-2">
                                          ↳
                                        </span>
                                        <span className="text-foreground font-semibold">
                                          {org.name}
                                        </span>
                                      </div>
                                      <div className="text-muted-foreground">
                                        {org.slug || "-"}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {org.member_count}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {formatDate(org.created_at)}
                                      </div>
                                      <div />
                                    </div>
                                  ))}
                                </div>
                              )}
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
                    No individuals yet.
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
              table.getRowModel().rows.map((row) => {
                const member = row.original
                const memberId = member.id
                const isOpen = !!expandedRows[row.id]
                const fullName = [member.first_name, member.last_name]
                  .filter(Boolean)
                  .join(" ") || "-"
                return (
                  <div key={row.id}>
                    <div
                      className="cursor-pointer rounded-lg border p-3"
                      onClick={() => toggleRow(row.id, memberId)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-[15px] font-semibold">{fullName}</div>
                          <div className="mt-0.5 text-sm text-muted-foreground capitalize">
                            {formatRole(member.clerk_org_role)} / {formatRole(member.clerk_member_role)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm text-muted-foreground">
                            {member.org_count} org{member.org_count !== 1 ? "s" : ""}
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              isOpen ? "rotate-180" : "-rotate-90"
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="ml-3 mt-1 space-y-2 border-l-2 border-muted pl-3">
                        {orgsLoading[memberId] && orgsMap[memberId] === undefined ? (
                          <div className="py-2 text-sm text-muted-foreground">Loading organizations...</div>
                        ) : orgsMap[memberId] == null ? (
                          <div className="py-2 text-sm text-destructive">Failed to load organizations.</div>
                        ) : (orgsMap[memberId]?.length ?? 0) === 0 ? (
                          <div className="py-2 text-sm text-muted-foreground">No organizations linked.</div>
                        ) : (
                          orgsMap[memberId]?.map((org) => (
                            <div key={org.id} className="rounded border p-2 text-sm">
                              <div className="font-semibold">{org.name}</div>
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                {org.slug || "-"} &middot; {org.member_count} members
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                No individuals yet.
              </div>
            )}
          </div>
        </div>
      </div>
    <DealsStylePagination table={table} />
    </div>
    </DndContext>
  )
}

function Filter({ column }: { column: any }) {
  const columnFilterValue = column.getFilterValue()
  const inputId = "broker-individuals-filter-search"

  return (
    <div>
      <Label htmlFor={`${inputId}-input`} className="sr-only">
        Search
      </Label>
      <Input
        id={`${inputId}-input`}
        value={(columnFilterValue ?? "") as string}
        onChange={(e) => column.setFilterValue(e.target.value)}
        placeholder="Search individuals"
        type="text"
      />
    </div>
  )
}
