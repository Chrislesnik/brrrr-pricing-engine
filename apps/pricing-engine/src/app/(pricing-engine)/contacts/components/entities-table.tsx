"use client"

import { Fragment, useMemo, useState, type ReactNode } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown } from "lucide-react"
import { cn } from "@repo/lib/cn"
import { Button } from "@repo/ui/shadcn/button"
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

export function EntitiesTable({ data, initialOwnersMap }: Props) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const pageSize = 10
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })
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
                  "h-4 w-4 transition-transform",
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
          // Deduplicate names
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
        id: "actions",
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

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    // Use row.id as the stable row identifier to preserve state across data updates
    getRowId: (row) => row.id,
  })

  return (
    <div className="w-full rounded-lg border">
      <div className="border-b">
        <div className="flex min-h-17 flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="font-medium">Entities</span>
          <Filter column={table.getColumn("display_id")!} />
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
                    {isOpen ? (
                      ownersLoading[row.original.id] &&
                      ownersMap[row.original.id] === undefined ? (
                        <TableRow className="bg-muted/30">
                          <TableCell
                            colSpan={columns.length}
                            className="text-muted-foreground p-4 text-sm"
                          >
                            Loading members...
                          </TableCell>
                        </TableRow>
                      ) : ownersMap[row.original.id] == null ? (
                        <TableRow className="bg-muted/30">
                          <TableCell
                            colSpan={columns.length}
                            className="text-destructive p-4 text-sm"
                          >
                            Failed to load members.
                          </TableCell>
                        </TableRow>
                      ) : (ownersMap[row.original.id]?.length ?? 0) === 0 ? (
                        <TableRow className="bg-muted/30">
                          <TableCell
                            colSpan={columns.length}
                            className="text-muted-foreground p-4 text-sm"
                          >
                            No members listed.
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={columns.length} className="p-0">
                              <div className="text-muted-foreground grid grid-cols-5 gap-4 px-6 py-2 text-[11px] font-semibold uppercase">
                                <span>ID</span>
                                <span>Name</span>
                                <span>Type</span>
                                <span>Title</span>
                                <span>% Ownership</span>
                              </div>
                            </TableCell>
                          </TableRow>
                          {ownersMap[row.original.id]?.map((owner, idx) => (
                            <MemberRow
                              key={`${row.original.id}-owner-${idx}`}
                              owner={owner}
                              depth={1}
                              columns={columns.length}
                              ancestors={new Set([row.original.id])}
                              expandedMembers={expandedMembers}
                              onToggle={toggleMember}
                              ownersMap={ownersMap}
                              ownersLoading={ownersLoading}
                              entityDetailsMap={entityDetailsMap}
                              entityDetailsLoading={entityDetailsLoading}
                            />
                          ))}
                        </>
                      )
                    ) : null}
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

      <DataTablePagination table={table} />
    </div>
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
      <TableRow className={cn("bg-muted/30", canExpand && "cursor-pointer")}>
        <TableCell colSpan={columns} className="p-0">
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
                      "h-4 w-4 transition-transform",
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
        </TableCell>
      </TableRow>

      {canExpand && isExpanded ? (
        childOwnersLoading && childOwners === undefined ? (
          <TableRow className="bg-muted/40">
            <TableCell
              colSpan={columns}
              className="text-muted-foreground p-4 text-sm"
            >
              Loading members...
            </TableCell>
          </TableRow>
        ) : childOwners == null ? (
          <TableRow className="bg-muted/40">
            <TableCell
              colSpan={columns}
              className="text-destructive p-4 text-sm"
            >
              Failed to load members.
            </TableCell>
          </TableRow>
        ) : (childOwners?.length ?? 0) === 0 ? (
          <TableRow className="bg-muted/40">
            <TableCell
              colSpan={columns}
              className="text-muted-foreground p-4 text-sm"
            >
              No members listed.
            </TableCell>
          </TableRow>
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
