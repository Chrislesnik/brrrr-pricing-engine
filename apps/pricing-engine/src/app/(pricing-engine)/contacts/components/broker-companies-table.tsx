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
import { ChevronDown, MoreHorizontal, UserPlus, Settings, Archive } from "lucide-react"
import { cn } from "@repo/lib/cn"
import { Button } from "@repo/ui/shadcn/button"
import { Input } from "@repo/ui/shadcn/input"
import { Label } from "@repo/ui/shadcn/label"
import {
  DropdownMenu,
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
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table"
import { DataTablePagination } from "../../users/components/data-table-pagination"
import type {
  BrokerOrgRow,
  OrgMemberRow,
} from "../data/fetch-broker-companies"

interface Props {
  data: BrokerOrgRow[]
  initialMembersMap?: Record<string, OrgMemberRow[]>
  /** Called when "Invite Members" is selected from a row action dropdown */
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

export function BrokerCompaniesTable({ data, initialMembersMap, onInviteMembers }: Props) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const pageSize = 10
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [membersMap, setMembersMap] = useState<
    Record<string, OrgMemberRow[] | null | undefined>
  >(initialMembersMap ?? {})
  const [membersLoading, setMembersLoading] = useState<
    Record<string, boolean>
  >({})

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
        header: "Date Added",
        accessorKey: "created_at",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const org = row.original
          return (
            <div className="flex justify-end">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    aria-label="Open menu"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onSelect={() => onInviteMembers?.(org.id)}
                    >
                      <UserPlus className="mr-2 h-4 w-4 opacity-60" />
                      Invite Members
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="text-red-600">
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
        meta: { className: "w-10 text-right sticky right-0 bg-background z-10" },
      },
    ]
  }, [expandedRows, onInviteMembers])

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
          <span className="font-medium">Organizations</span>
          <Filter column={table.getColumn("name")!} />
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
                      membersLoading[orgId] &&
                      membersMap[orgId] === undefined ? (
                        <TableRow className="bg-muted/30">
                          <TableCell
                            colSpan={columns.length}
                            className="text-muted-foreground p-4 text-sm"
                          >
                            Loading members...
                          </TableCell>
                        </TableRow>
                      ) : membersMap[orgId] == null ? (
                        <TableRow className="bg-muted/30">
                          <TableCell
                            colSpan={columns.length}
                            className="text-destructive p-4 text-sm"
                          >
                            Failed to load members.
                          </TableCell>
                        </TableRow>
                      ) : (membersMap[orgId]?.length ?? 0) === 0 ? (
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
                            <TableCell
                              colSpan={columns.length}
                              className="p-0"
                            >
                              <div className="text-muted-foreground grid grid-cols-5 gap-4 px-6 py-2 text-[11px] font-semibold uppercase">
                                <span>ID</span>
                                <span>Name</span>
                                <span>Org Role</span>
                                <span>Member Role</span>
                                <span>Joined</span>
                              </div>
                            </TableCell>
                          </TableRow>
                          {membersMap[orgId]?.map((member) => (
                            <TableRow
                              key={member.id}
                              className="bg-muted/30"
                            >
                              <TableCell
                                colSpan={columns.length}
                                className="p-0"
                              >
                                <div className="grid grid-cols-5 items-center gap-4 px-6 py-2 text-sm">
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
                                    {[
                                      member.first_name,
                                      member.last_name,
                                    ]
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
                              </TableCell>
                            </TableRow>
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
                  No organizations yet.
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
