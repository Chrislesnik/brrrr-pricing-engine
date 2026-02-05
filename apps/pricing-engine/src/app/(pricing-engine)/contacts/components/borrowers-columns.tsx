"use client"

import { format } from "date-fns"
import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@repo/ui/shadcn/checkbox"
import LongText from "@repo/ui/custom/long-text"
import { DataTableColumnHeader } from "../../users/components/data-table-column-header"
import { Borrower } from "../data/types"
import { BorrowerRowActions } from "./borrower-row-actions"

function formatUSDisplay(input: string | null | undefined): string {
  const raw = (input ?? "").toString()
  const digits = raw.replace(/\D+/g, "")
  if (!digits) return "-"
  // Handle +1XXXXXXXXXX or 1XXXXXXXXXX or XXXXXXXXXX
  let cc = ""
  let national = ""
  if (digits.length === 11 && digits.startsWith("1")) {
    cc = "+1"
    national = digits.slice(1)
  } else if (digits.length === 10) {
    cc = "+1"
    national = digits
  } else {
    // Fallback: return original if not 10/11 digits
    return raw
  }
  const a = national.slice(0, 3)
  const b = national.slice(3, 6)
  const c = national.slice(6, 10)
  return `${cc} (${a}) ${b}-${c}`
}

function formatYmdToDisplay(ymd: string | null | undefined): string {
  const s = (ymd ?? "").toString()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "-"
  const [y, m, d] = s.split("-").map((p) => Number(p))
  const monthNames = [
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
  const mon = monthNames[(m || 1) - 1] ?? ""
  return `${String(d).padStart(2, "0")} ${mon}, ${y}`
}

export const borrowerColumns: ColumnDef<Borrower>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
    meta: { className: "w-10 [&:has([role=checkbox])]:pl-3" },
  },
  {
    id: "search",
    accessorFn: (row) =>
      `${row.display_id} ${row.first_name} ${row.last_name} ${row.email ?? ""} ${row.primary_phone ?? ""} ${row.alt_phone ?? ""}`.toLowerCase(),
    header: () => null,
    cell: () => null,
    enableSorting: false,
    enableHiding: true,
    meta: { className: "hidden" },
  },
  {
    accessorKey: "display_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => (
      <LongText className="max-w-28">{row.original.display_id}</LongText>
    ),
    meta: { className: "w-28" },
    enableSorting: false,
  },
  {
    id: "full_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Full Name" />
    ),
    cell: ({ row }) => {
      const { first_name, last_name } = row.original
      return <div>{`${first_name} ${last_name}`}</div>
    },
    enableSorting: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email Address" />
    ),
    cell: ({ row }) => (
      <LongText className="max-w-56">{row.original.email ?? "-"}</LongText>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "primary_phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Primary Phone" />
    ),
    cell: ({ row }) => (
      <div className="w-fit text-nowrap">
        {formatUSDisplay(row.original.primary_phone)}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "alt_phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Alternate Phone" />
    ),
    cell: ({ row }) => (
      <div className="w-fit text-nowrap">
        {formatUSDisplay(row.original.alt_phone)}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "date_of_birth",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date of Birth" />
    ),
    cell: ({ row }) => {
      const display = formatYmdToDisplay(row.original.date_of_birth)
      return <div className="w-fit text-nowrap">{display}</div>
    },
    enableSorting: true,
  },
  {
    accessorKey: "fico_score",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="FICO Score" />
    ),
    enableSorting: true,
  },
  {
    id: "assigned_to_names",
    accessorFn: (row) => (row as Borrower).assigned_to_names ?? [],
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assigned To" />
    ),
    cell: ({ row }) => {
      const names = row.original.assigned_to_names ?? []
      return (
        <LongText className="max-w-56">
          {names.length ? names.join(", ") : "-"}
        </LongText>
      )
    },
    // OR matching for selected names
    filterFn: (row, _columnId, filterValue) => {
      const selected = Array.isArray(filterValue)
        ? (filterValue as string[])
        : []
      if (selected.length === 0) return true
      const namesArr = ((row.original as Borrower).assigned_to_names ??
        []) as string[]
      const cell = namesArr.join(", ").toLowerCase()
      return selected.some((name) => cell.includes(String(name).toLowerCase()))
    },
    enableSorting: false,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date Created" />
    ),
    cell: ({ row }) => (
      <div className="w-fit text-nowrap">
        {format(new Date(row.original.created_at), "dd MMM, yyyy")}
      </div>
    ),
    enableSorting: true,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const b = row.original
      return <BorrowerRowActions borrower={b} />
    },
    meta: { className: "w-10 text-right sticky right-0 bg-background z-10" },
  },
]
