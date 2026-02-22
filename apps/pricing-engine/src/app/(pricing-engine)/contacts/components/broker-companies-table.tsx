"use client"

import React, { Fragment, useCallback, useMemo, useState } from "react"
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
import { ChevronDown, Columns2, MoreHorizontal, Plus, Search, Settings, UserPlus, Archive } from "lucide-react"
import { cn } from "@repo/lib/cn"
import { Badge } from "@repo/ui/shadcn/badge"
import { Button } from "@repo/ui/shadcn/button"
import { Checkbox } from "@repo/ui/shadcn/checkbox"
import { Input } from "@repo/ui/shadcn/input"
import { Label } from "@repo/ui/shadcn/label"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu"
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

import { BrokerSettingsDialog } from "../brokers/components/broker-settings-dialog"
import { RoleAssignmentDialog } from "@/components/role-assignment-dialog"
import type {
  BrokerOrgRow,
  OrgMemberRow,
} from "../data/fetch-broker-companies"

interface Props {
  data: BrokerOrgRow[]
  initialMembersMap?: Record<string, OrgMemberRow[]>
  onSettingsChanged?: () => void
  onInviteMembers?: (orgId: string) => void
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

function ActionsCell({
  org,
  onOpenSettings,
  onOpenAssign,
}: {
  org: BrokerOrgRow
  onOpenSettings: (orgId: string) => void
  onOpenAssign: (orgId: string) => void
}) {
  return (
    <div className="flex justify-center">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onOpenSettings(org.id)
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            Broker Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onOpenAssign(org.id)
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Assign Account Manager
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function BrokerCompaniesTable({ data, initialMembersMap, onSettingsChanged, onInviteMembers, actionButton }: Props & { actionButton?: React.ReactNode }) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const pageSize = 10
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })
  const [rowSelection, setRowSelection] = useState({})
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [membersMap, setMembersMap] = useState<
    Record<string, OrgMemberRow[] | null | undefined>
  >(initialMembersMap ?? {})
  const [membersLoading, setMembersLoading] = useState<
    Record<string, boolean>
  >({})

  const [settingsOrgId, setSettingsOrgId] = useState<string | null>(null)
  const [assignOrgId, setAssignOrgId] = useState<string | null>(null)

  const onOpenSettings = useCallback((orgId: string) => setSettingsOrgId(orgId), [])
  const onOpenAssign = useCallback((orgId: string) => setAssignOrgId(orgId), [])

  const fetchMembers = async (orgId: string) => {
    if (membersMap[orgId] !== undefined || membersLoading[orgId]) return
    setMembersLoading((prev) => ({ ...prev, [orgId]: true }))
    try {
      const res = await fetch(
        `/api/brokers/companies/${encodeURIComponent(orgId)}/members`,
        { cache: "no-store" }
      )
      if (!res.ok) {
        setMembersMap((prev) => ({ ...prev, [orgId]: null }))
        return
      }
      const j = (await res.json().catch(() => ({}))) as {
        members?: OrgMemberRow[]
      }
      setMembersMap((prev) => ({
        ...prev,
        [orgId]: Array.isArray(j.members) ? j.members : [],
      }))
    } catch {
      setMembersMap((prev) => ({ ...prev, [orgId]: null }))
    } finally {
      setMembersLoading((prev) => ({ ...prev, [orgId]: false }))
    }
  }

  const isAnyDialogOpen = () =>
    typeof document !== "undefined" &&
    document.querySelector("[data-slot='dialog-content'][data-state='open']")

  const toggleRow = (rowId: string, orgId: string) => {
    if (isAnyDialogOpen()) return
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }))
    fetchMembers(orgId)
  }

  const columns = useMemo<ColumnDef<BrokerOrgRow>[]>(() => {
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
        header: "Organization Name",
        accessorKey: "name",
        cell: ({ row }) => (
          <span className="text-foreground text-sm font-semibold">
            {row.getValue("name") || "-"}
          </span>
        ),
        filterFn: (row, _columnId, value) => {
          const term = String(value ?? "")
            .toLowerCase()
            .trim()
          if (!term) return true
          const haystack = [
            row.original.name,
            row.original.slug ?? "",
          ]
            .join(" ")
            .toLowerCase()
          return haystack.includes(term)
        },
      },
      {
        header: "Slug",
        accessorKey: "slug",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.slug || "-"}
          </span>
        ),
      },
      {
        header: "Members",
        accessorKey: "member_count",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.member_count}
          </span>
        ),
      },
      {
        header: "Permissions",
        accessorKey: "permissions",
        cell: ({ row }) => {
          const p = row.original.permissions ?? "default"
          const color =
            p === "custom"
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-highlight-muted text-highlight-foreground border-highlight/30"
          return (
            <Badge variant="outline" className={cn("uppercase text-[10px]", color)}>
              {p}
            </Badge>
          )
        },
      },
      {
        header: "Date Added",
        accessorKey: "created_at",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
      {
        id: "row_actions",
        header: "",
        cell: ({ row }) => (
          <ActionsCell
            org={row.original}
            onOpenSettings={onOpenSettings}
            onOpenAssign={onOpenAssign}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ]
  }, [expandedRows, onOpenSettings, onOpenAssign])

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
              placeholder="Search organizations..."
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
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
                  const orgId = row.original.id
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
                          toggleRow(row.id, orgId)
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
                              {membersLoading[orgId] &&
                              membersMap[orgId] === undefined ? (
                                <div className="text-muted-foreground p-4 text-sm">
                                  Loading members...
                                </div>
                              ) : membersMap[orgId] == null ? (
                                <div className="text-destructive p-4 text-sm">
                                  Failed to load members.
                                </div>
                              ) : (membersMap[orgId]?.length ?? 0) === 0 ? (
                                <div className="text-muted-foreground p-4 text-sm">
                                  No members listed.
                                </div>
                              ) : (
                                <div>
                                  <div className="text-muted-foreground grid grid-cols-5 gap-4 px-6 py-2 text-[11px] font-semibold uppercase">
                                    <span>ID</span>
                                    <span>Name</span>
                                    <span>Org Role</span>
                                    <span>Member Role</span>
                                    <span>Joined</span>
                                  </div>
                                  {membersMap[orgId]?.map((member) => (
                                    <div
                                      key={member.id}
                                      className="grid grid-cols-5 items-center gap-4 px-6 py-2 text-sm"
                                    >
                                      <div className="flex items-center">
                                        <span className="text-muted-foreground mr-2">
                                          ↳
                                        </span>
                                        <span className="text-muted-foreground">
                                          {member.user_id
                                            ? member.user_id.slice(0, 12) + "…"
                                            : member.id.slice(0, 12) + "…"}
                                        </span>
                                      </div>
                                      <div className="text-foreground font-semibold">
                                        {[member.first_name, member.last_name]
                                          .filter(Boolean)
                                          .join(" ") || "-"}
                                      </div>
                                      <div className="text-muted-foreground capitalize">
                                        {formatRole(member.clerk_org_role)}
                                      </div>
                                      <div className="text-muted-foreground capitalize">
                                        {formatRole(member.clerk_member_role)}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {formatDate(member.created_at)}
                                      </div>
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
                    No organizations yet.
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
                const org = row.original
                const orgId = org.id
                const isOpen = !!expandedRows[row.id]
                return (
                  <div key={row.id}>
                    <div
                      className="cursor-pointer rounded-lg border p-3"
                      onClick={() => toggleRow(row.id, orgId)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-[15px] font-semibold">{org.name || "-"}</div>
                          <div className="mt-0.5 text-sm text-muted-foreground">{org.slug || "-"}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm text-muted-foreground">
                            {org.member_count} member{org.member_count !== 1 ? "s" : ""}
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              isOpen ? "rotate-180" : "-rotate-90"
                            )}
                          />
                        </div>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "uppercase text-[10px]",
                            org.permissions === "custom"
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "bg-highlight-muted text-highlight-foreground border-highlight/30"
                          )}
                        >
                          {org.permissions ?? "default"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Added {formatDate(org.created_at)}
                        </span>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="ml-3 mt-1 space-y-2 border-l-2 border-muted pl-3">
                        {membersLoading[orgId] && membersMap[orgId] === undefined ? (
                          <div className="py-2 text-sm text-muted-foreground">Loading members...</div>
                        ) : membersMap[orgId] == null ? (
                          <div className="py-2 text-sm text-destructive">Failed to load members.</div>
                        ) : (membersMap[orgId]?.length ?? 0) === 0 ? (
                          <div className="py-2 text-sm text-muted-foreground">No members listed.</div>
                        ) : (
                          membersMap[orgId]?.map((member) => (
                            <div key={member.id} className="rounded border p-2 text-sm">
                              <div className="font-semibold">
                                {[member.first_name, member.last_name].filter(Boolean).join(" ") || "-"}
                              </div>
                              <div className="mt-0.5 text-xs text-muted-foreground capitalize">
                                {formatRole(member.clerk_org_role)} / {formatRole(member.clerk_member_role)}
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
                No organizations yet.
              </div>
            )}
          </div>
        </div>
      </div>
      <DealsStylePagination table={table} />

      {settingsOrgId && (
        <BrokerSettingsDialog
          brokerOrgId={settingsOrgId}
          open={!!settingsOrgId}
          onOpenChange={(v) => { if (!v) setSettingsOrgId(null) }}
          onSaved={() => onSettingsChanged?.()}
        />
      )}

      {assignOrgId && (
        <RoleAssignmentDialog
          resourceType="broker_org"
          resourceId={assignOrgId}
          open={!!assignOrgId}
          onOpenChange={(v) => { if (!v) setAssignOrgId(null) }}
          onSaved={() => onSettingsChanged?.()}
        />
      )}
    </div>
    </DndContext>
  )
}

function Filter({ column }: { column: any }) {
  const columnFilterValue = column.getFilterValue()
  const inputId = "broker-orgs-filter-search"

  return (
    <div>
      <Label htmlFor={`${inputId}-input`} className="sr-only">
        Search
      </Label>
      <Input
        id={`${inputId}-input`}
        value={(columnFilterValue ?? "") as string}
        onChange={(e) => column.setFilterValue(e.target.value)}
        placeholder="Search organizations"
        type="text"
      />
    </div>
  )
}
