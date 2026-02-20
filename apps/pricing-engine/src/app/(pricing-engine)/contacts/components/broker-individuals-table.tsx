"use client"

import { Fragment, useMemo, useState } from "react"
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
  const pageSize = 10
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })
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
    getRowId: (row) => row.id,
  })

  return (
    <div className="w-full rounded-lg border">
      <div className="border-b">
        <div className="flex min-h-17 flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="font-medium">Individuals</span>
          <Filter column={table.getColumn("last_name")!} />
        </div>
        {/* Desktop table */}
        <div className="hidden md:block">
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

      <DataTablePagination table={table} />
    </div>
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
