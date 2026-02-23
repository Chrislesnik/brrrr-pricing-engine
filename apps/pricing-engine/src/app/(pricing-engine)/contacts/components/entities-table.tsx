"use client"

import { Fragment, useMemo, useState, type ReactNode } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  ColumnOrderState,
  PaginationState,
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
import { EntityProfile } from "../data/types"
import { EntityRowActions } from "./entity-row-actions"

type EntityRow = EntityProfile
type EntityOwner = {
  name: string | null
  title: string | null
  member_type: string | null
  ownership_percent: number | null
  entity_id?: string | null
  entity_owner_id?: string | null
  entity_display_id?: string | null
  entity_display_name?: string | null
  borrower_display_id?: string | null
}

interface Props {
  data: EntityProfile[]
  initialOwnersMap?: Record<string, EntityOwner[]>
}

function formatEIN(ein: string | null | undefined) {
  const digits = String(ein ?? "")
    .replace(/\D+/g, "")
    .slice(0, 9)
  if (!digits) return "-"
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}-${digits.slice(2)}`
}

function formatDate(ymd: string | null | undefined) {
  const s = (ymd ?? "").toString()
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s)) return "-"
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

export function EntitiesTable({ data, initialOwnersMap, actionButton }: Props & { actionButton?: ReactNode }) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const pageSize = 10
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })
  const [rowSelection, setRowSelection] = useState({})
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [ownersMap, setOwnersMap] = useState<
    Record<string, EntityOwner[] | null | undefined>
  >(initialOwnersMap ?? {})
  const [ownersLoading, setOwnersLoading] = useState<Record<string, boolean>>(
    {}
  )
  const [expandedMembers, setExpandedMembers] = useState<
    Record<string, boolean>
  >({})
  const [entityDetailsMap, setEntityDetailsMap] = useState<
    Record<string, EntityProfile | null | undefined>
  >({})
  const [entityDetailsLoading, setEntityDetailsLoading] = useState<
    Record<string, boolean>
  >({})

  const fetchOwners = async (entityId: string) => {
    if (ownersMap[entityId] !== undefined || ownersLoading[entityId]) return
    setOwnersLoading((prev) => ({ ...prev, [entityId]: true }))
    try {
      const res = await fetch(
        `/api/applicants/entities/${encodeURIComponent(entityId)}/owners`,
        { cache: "no-store" }
      )
      if (!res.ok) {
        setOwnersMap((prev) => ({ ...prev, [entityId]: null }))
        return
      }
      const j = (await res.json().catch(() => ({}))) as {
        owners?: EntityOwner[]
      }
      setOwnersMap((prev) => ({
        ...prev,
        [entityId]: Array.isArray(j.owners) ? j.owners : [],
      }))
    } catch {
      setOwnersMap((prev) => ({ ...prev, [entityId]: null }))
    } finally {
      setOwnersLoading((prev) => ({ ...prev, [entityId]: false }))
    }
  }

  const fetchEntityDetails = async (entityId: string) => {
    if (
      entityDetailsMap[entityId] !== undefined ||
      entityDetailsLoading[entityId]
    )
      return
    setEntityDetailsLoading((prev) => ({ ...prev, [entityId]: true }))
    try {
      const res = await fetch(
        `/api/applicants/entities/${encodeURIComponent(entityId)}`,
        { cache: "no-store" }
      )
      if (!res.ok) {
        setEntityDetailsMap((prev) => ({ ...prev, [entityId]: null }))
        return
      }
      const j = (await res.json().catch(() => ({}))) as {
        entity?: EntityProfile
      }
      setEntityDetailsMap((prev) => ({
        ...prev,
        [entityId]: (j?.entity as EntityProfile) ?? null,
      }))
    } catch {
      setEntityDetailsMap((prev) => ({ ...prev, [entityId]: null }))
    } finally {
      setEntityDetailsLoading((prev) => ({ ...prev, [entityId]: false }))
    }
  }

  const isAnyDialogOpen = () =>
    typeof document !== "undefined" &&
    document.querySelector("[data-slot='dialog-content'][data-state='open']")

  const toggleRow = (rowId: string, entityId: string) => {
    if (isAnyDialogOpen()) return
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }))
    fetchOwners(entityId)
  }

  const toggleMember = (entityId: string | undefined | null) => {
    if (!entityId) return
    setExpandedMembers((prev) => ({ ...prev, [entityId]: !prev[entityId] }))
    fetchOwners(entityId)
    fetchEntityDetails(entityId)
  }

  const columns = useMemo<ColumnDef<EntityRow>[]>(() => {
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
        header: "ID",
        accessorKey: "display_id",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.getValue("display_id") || "-"}
          </span>
        ),
        filterFn: (row, _columnId, value) => {
          const term = String(value ?? "")
            .toLowerCase()
            .trim()
          if (!term) return true
          const haystack = [
            row.original.display_id,
            row.original.entity_name,
            row.original.entity_type ?? "",
            row.original.ein ?? "",
            (row.original.assigned_to_names ?? []).join(" "),
          ]
            .join(" ")
            .toLowerCase()
          return haystack.includes(term)
        },
      },
      {
        header: "Entity Name",
        accessorKey: "entity_name",
        cell: ({ row }) => (
          <span className="text-foreground text-sm font-semibold">
            {row.getValue("entity_name") || "-"}
          </span>
        ),
      },
      {
        header: "Entity Type",
        accessorKey: "entity_type",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.getValue("entity_type") || "-"}
          </span>
        ),
      },
      {
        header: "EIN",
        accessorKey: "ein",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatEIN(row.original.ein)}
          </span>
        ),
      },
      {
        header: "Date Formed",
        accessorKey: "date_formed",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(row.original.date_formed)}
          </span>
        ),
      },
      {
        header: "Assigned To",
        accessorKey: "assigned_to_names",
        cell: ({ row }) => {
          const rawNames = Array.isArray(row.original.assigned_to_names)
            ? row.original.assigned_to_names
            : []
          const names = [...new Set(rawNames)]
          return (
            <span className="text-muted-foreground text-sm">
              {names.length ? names.join(", ") : "Unassigned"}
            </span>
          )
        },
      },
      {
        header: () => <div className="w-full text-center">Actions</div>,
        id: "row_actions",
        cell: ({ row }) => (
          <div className="flex w-full items-center justify-center">
            <EntityRowActions entity={row.original} />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ]
  }, [expandedRows])

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
    state: {
      columnFilters,
      columnVisibility,
      pagination,
      columnOrder,
      rowSelection,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getRowId: (row) => row.id,
  })

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
                placeholder="Search entities..."
                value={(table.getColumn("display_id")?.getFilterValue() as string) ?? ""}
                onChange={(e) => table.getColumn("display_id")?.setFilterValue(e.target.value)}
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
            {actionButton}
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
                  table.getRowModel().rows.map((row) => {
                    const isOpen = !!expandedRows[row.id]
                    return (
                      <Fragment key={row.id}>
                        <TableRow
                          data-state={row.getIsSelected() && "selected"}
                          className="cursor-pointer"
                          onClick={(e) => {
                            if (isAnyDialogOpen()) return
                            const interactive = (e.target as HTMLElement).closest(
                              "button, a, input, select, textarea, [role='menuitem'], [role='menu'], [data-radix-popper-content]"
                            )
                            if (interactive) return
                            toggleRow(row.id, row.original.id)
                          }}
                          aria-expanded={isOpen}
                        >
                          {row.getVisibleCells().map((cell) => {
                            const isPinned = PINNED_RIGHT_SET.has(cell.column.id)
                            const metaClassName = (cell.column.columnDef.meta as Record<string, unknown> | undefined)?.className as string | undefined
                            return (
                              <TableCell
                                key={cell.id}
                                className={cn(
                                  "h-14 first:pl-4 last:pr-4",
                                  isPinned && "bg-background group-hover/row:bg-transparent !px-1",
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
                      <TableRow className="bg-muted/30 border-0">
                        <TableCell colSpan={columns.length} className="p-0">
                          <div
                            className="grid transition-[grid-template-rows] duration-200 ease-out"
                            style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                          >
                            <div className="overflow-hidden">
                              {ownersLoading[row.original.id] &&
                              ownersMap[row.original.id] === undefined ? (
                                <div className="text-muted-foreground p-4 text-sm">
                                  Loading members...
                                </div>
                              ) : ownersMap[row.original.id] == null ? (
                                <div className="text-destructive p-4 text-sm">
                                  Failed to load members.
                                </div>
                              ) : (ownersMap[row.original.id]?.length ?? 0) ===
                                0 ? (
                                <div className="text-muted-foreground p-4 text-sm">
                                  No members listed.
                                </div>
                              ) : (
                                <div>
                                  <div className="text-muted-foreground grid grid-cols-5 gap-4 px-6 py-2 text-[11px] font-semibold uppercase">
                                    <span>ID</span>
                                    <span>Name</span>
                                    <span>Type</span>
                                    <span>Title</span>
                                    <span>% Ownership</span>
                                  </div>
                                  {ownersMap[row.original.id]?.map(
                                    (owner, idx) => (
                                      <MemberRow
                                        key={`${row.original.id}-owner-${idx}`}
                                        owner={owner}
                                        depth={1}
                                        columns={columns.length}
                                        ancestors={
                                          new Set([row.original.id])
                                        }
                                        expandedMembers={expandedMembers}
                                        onToggle={toggleMember}
                                        ownersMap={ownersMap}
                                        ownersLoading={ownersLoading}
                                        entityDetailsMap={entityDetailsMap}
                                        entityDetailsLoading={
                                          entityDetailsLoading
                                        }
                                      />
                                    )
                                  )}
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
                    No entities yet.
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
                const entity = row.original
                const entityId = entity.id
                const isOpen = !!expandedRows[row.id]
                const names = Array.isArray(entity.assigned_to_names)
                  ? [...new Set(entity.assigned_to_names)]
                  : []
                return (
                  <div key={row.id}>
                    <div
                      className="cursor-pointer rounded-lg border p-3"
                      onClick={() => toggleRow(row.id, entityId)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-[15px] font-semibold">
                            {entity.entity_name || "-"}
                          </div>
                          <div className="mt-0.5 text-sm text-muted-foreground">
                            {entity.display_id || "-"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <EntityRowActions entity={entity} />
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>{entity.entity_type || "-"}</span>
                        <span>EIN: {formatEIN(entity.ein)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Formed: {formatDate(entity.date_formed)}</span>
                        <span>{names.length ? names.join(", ") : "Unassigned"}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 transition-transform",
                            isOpen ? "rotate-180" : "-rotate-90"
                          )}
                        />
                        <span>{isOpen ? "Hide" : "Show"} members</span>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="ml-3 mt-1 space-y-2 border-l-2 border-muted pl-3">
                        {ownersLoading[entityId] && ownersMap[entityId] === undefined ? (
                          <div className="py-2 text-sm text-muted-foreground">Loading members...</div>
                        ) : ownersMap[entityId] == null ? (
                          <div className="py-2 text-sm text-destructive">Failed to load members.</div>
                        ) : (ownersMap[entityId]?.length ?? 0) === 0 ? (
                          <div className="py-2 text-sm text-muted-foreground">No members listed.</div>
                        ) : (
                          ownersMap[entityId]?.map((owner, idx) => (
                            <MobileMemberCard
                              key={`${entityId}-m-${idx}`}
                              owner={owner}
                              depth={0}
                              ancestors={new Set([entityId])}
                              expandedMembers={expandedMembers}
                              onToggle={toggleMember}
                              ownersMap={ownersMap}
                              ownersLoading={ownersLoading}
                              entityDetailsMap={entityDetailsMap}
                              entityDetailsLoading={entityDetailsLoading}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                No entities yet.
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
  const columnHeader =
    typeof column.columnDef.header === "string"
      ? column.columnDef.header
      : "Search"
  const inputId = `entities-filter-${column.id || "search"}`

  return (
    <div>
      <Label htmlFor={`${inputId}-input`} className="sr-only">
        {columnHeader}
      </Label>
      <Input
        id={`${inputId}-input`}
        value={(columnFilterValue ?? "") as string}
        onChange={(e) => column.setFilterValue(e.target.value)}
        placeholder="Search entities"
        type="text"
      />
    </div>
  )
}

function _InfoBlock({
  label,
  value,
  bold = false,
}: {
  label: string
  value: ReactNode
  bold?: boolean
}) {
  return (
    <div>
      <div className="text-muted-foreground text-[11px] font-semibold uppercase">
        {label}
      </div>
      <div className={cn("text-foreground", bold && "font-semibold")}>
        {value}
      </div>
    </div>
  )
}

type MemberRowProps = {
  owner: EntityOwner
  depth: number
  columns: number
  ancestors: Set<string>
  expandedMembers: Record<string, boolean>
  onToggle: (entityId: string | undefined | null) => void
  ownersMap: Record<string, EntityOwner[] | null | undefined>
  ownersLoading: Record<string, boolean>
  entityDetailsMap: Record<string, EntityProfile | null | undefined>
  entityDetailsLoading: Record<string, boolean>
}

function MemberRow({
  owner,
  depth,
  columns,
  ancestors,
  expandedMembers,
  onToggle,
  ownersMap,
  ownersLoading,
  entityDetailsMap,
  entityDetailsLoading,
}: MemberRowProps) {
  const linkedId = owner.entity_owner_id ?? undefined
  const isLinked = !!linkedId
  const hasLoop = linkedId ? ancestors.has(linkedId) : false
  const canExpand = isLinked && !hasLoop
  const isExpanded = linkedId ? !!expandedMembers[linkedId] : false
  const entity = linkedId ? entityDetailsMap[linkedId] : undefined

  const displayId =
    (linkedId
      ? (entity?.display_id ?? owner.entity_display_id)
      : (owner.borrower_display_id ?? owner.entity_display_id)) ?? "—"
  const displayName = linkedId
    ? (entity?.entity_name ?? owner.entity_display_name ?? owner.name ?? "-")
    : (owner.name ?? "-")
  const displayType = linkedId
    ? (entity?.entity_type ?? owner.member_type ?? "-")
    : (owner.member_type ?? "-")
  const _displayEin = linkedId ? formatEIN(entity?.ein) : "—"
  const _displayDate = linkedId ? formatDate(entity?.date_formed) : "—"
  const _displayAssigned =
    linkedId &&
    Array.isArray(entity?.assigned_to_names) &&
    entity.assigned_to_names.length
      ? entity.assigned_to_names.join(", ")
      : "—"
  const displayTitle = owner.title || "-"
  const displayOwnership =
    owner.ownership_percent != null ? `${owner.ownership_percent}%` : "-"

  const childOwners = linkedId ? ownersMap[linkedId] : undefined
  const childOwnersLoading = linkedId ? ownersLoading[linkedId] : false
  const _entityLoading = linkedId ? entityDetailsLoading[linkedId] : false

  return (
    <>
      <div className={cn(canExpand && "cursor-pointer")}>
        <div
          className={cn(
            "grid grid-cols-5 items-center gap-4 px-6 py-2 text-sm",
            canExpand && "hover:bg-muted/40"
          )}
          onClick={
            canExpand
              ? (e) => {
                  e.stopPropagation()
                  onToggle(linkedId)
                }
              : undefined
          }
        >
          <div
            className="flex items-center"
            style={{ paddingLeft: depth * 16 }}
          >
            {canExpand ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggle(linkedId)
                }}
                aria-label={
                  isExpanded
                    ? "Collapse member entity"
                    : "Expand member entity"
                }
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isExpanded ? "rotate-180" : "-rotate-90"
                  )}
                  aria-hidden="true"
                />
              </Button>
            ) : (
              <span className="text-muted-foreground mr-2">↳</span>
            )}
            <span className="text-muted-foreground">{displayId}</span>
          </div>
          <div className="text-foreground font-semibold">{displayName}</div>
          <div className="text-muted-foreground">{displayType}</div>
          <div className="text-muted-foreground">{displayTitle}</div>
          <div className="text-muted-foreground">{displayOwnership}</div>
        </div>
      </div>

      {canExpand && isExpanded ? (
        childOwnersLoading && childOwners === undefined ? (
          <div className="text-muted-foreground p-4 text-sm">
            Loading members...
          </div>
        ) : childOwners == null ? (
          <div className="text-destructive p-4 text-sm">
            Failed to load members.
          </div>
        ) : (childOwners?.length ?? 0) === 0 ? (
          <div className="text-muted-foreground p-4 text-sm">
            No members listed.
          </div>
        ) : (
          childOwners?.map((child, idx) => (
            <MemberRow
              key={`${linkedId}-child-${idx}`}
              owner={child}
              depth={depth + 1}
              columns={columns}
              ancestors={new Set([...ancestors, linkedId!])}
              expandedMembers={expandedMembers}
              onToggle={onToggle}
              ownersMap={ownersMap}
              ownersLoading={ownersLoading}
              entityDetailsMap={entityDetailsMap}
              entityDetailsLoading={entityDetailsLoading}
            />
          ))
        )
      ) : null}
    </>
  )
}

type MobileMemberCardProps = {
  owner: EntityOwner
  depth: number
  ancestors: Set<string>
  expandedMembers: Record<string, boolean>
  onToggle: (entityId: string | undefined | null) => void
  ownersMap: Record<string, EntityOwner[] | null | undefined>
  ownersLoading: Record<string, boolean>
  entityDetailsMap: Record<string, EntityProfile | null | undefined>
  entityDetailsLoading: Record<string, boolean>
}

function MobileMemberCard({
  owner,
  depth,
  ancestors,
  expandedMembers,
  onToggle,
  ownersMap,
  ownersLoading,
  entityDetailsMap,
  entityDetailsLoading,
}: MobileMemberCardProps) {
  const linkedId = owner.entity_owner_id ?? undefined
  const isLinked = !!linkedId
  const hasLoop = linkedId ? ancestors.has(linkedId) : false
  const canExpand = isLinked && !hasLoop
  const isExpanded = linkedId ? !!expandedMembers[linkedId] : false
  const entity = linkedId ? entityDetailsMap[linkedId] : undefined

  const displayName = linkedId
    ? (entity?.entity_name ?? owner.entity_display_name ?? owner.name ?? "-")
    : (owner.name ?? "-")
  const displayType = linkedId
    ? (entity?.entity_type ?? owner.member_type ?? "-")
    : (owner.member_type ?? "-")
  const displayOwnership =
    owner.ownership_percent != null ? `${owner.ownership_percent}%` : "-"

  const childOwners = linkedId ? ownersMap[linkedId] : undefined
  const childOwnersLoading = linkedId ? ownersLoading[linkedId] : false

  return (
    <div>
      <div
        className={cn("rounded border p-2 text-sm", canExpand && "cursor-pointer")}
        onClick={canExpand ? () => onToggle(linkedId) : undefined}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{displayName}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {displayType} &middot; {displayOwnership} ownership
            </div>
            {owner.title && (
              <div className="text-xs text-muted-foreground">{owner.title}</div>
            )}
          </div>
          {canExpand && (
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                isExpanded ? "rotate-180" : "-rotate-90"
              )}
            />
          )}
        </div>
      </div>
      {canExpand && isExpanded && (
        <div className="ml-3 mt-1 space-y-2 border-l-2 border-muted pl-3">
          {childOwnersLoading && childOwners === undefined ? (
            <div className="py-2 text-sm text-muted-foreground">Loading members...</div>
          ) : childOwners == null ? (
            <div className="py-2 text-sm text-destructive">Failed to load members.</div>
          ) : (childOwners?.length ?? 0) === 0 ? (
            <div className="py-2 text-sm text-muted-foreground">No members listed.</div>
          ) : (
            childOwners?.map((child, idx) => (
              <MobileMemberCard
                key={`${linkedId}-mc-${idx}`}
                owner={child}
                depth={depth + 1}
                ancestors={new Set([...ancestors, linkedId!])}
                expandedMembers={expandedMembers}
                onToggle={onToggle}
                ownersMap={ownersMap}
                ownersLoading={ownersLoading}
                entityDetailsMap={entityDetailsMap}
                entityDetailsLoading={entityDetailsLoading}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
