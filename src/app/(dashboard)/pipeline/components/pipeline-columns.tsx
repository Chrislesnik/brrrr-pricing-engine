"use client"

import { format } from "date-fns"
import { ColumnDef } from "@tanstack/react-table"
import LongText from "@/components/long-text"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { DataTableColumnHeader } from "../../users/components/data-table-column-header"
import { LoanRow } from "../data/fetch-loans"

const statusClass: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  dead: "bg-red-100 text-red-800 border-red-200",
}

export const pipelineColumns: ColumnDef<LoanRow>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    cell: ({ row }) => (
      <LongText className="max-w-28">{row.getValue("id")}</LongText>
    ),
    meta: { className: "w-28" },
  },
  {
    accessorKey: "propertyAddress",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Property Address" />
    ),
    cell: ({ row }) => (
      <LongText className="max-w-64">
        {row.getValue("propertyAddress") ?? "-"}
      </LongText>
    ),
  },
  {
    id: "borrower",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Borrower" />
    ),
    cell: ({ row }) => {
      const firstName = (row.original as any).firstName ?? (row.original as any).borrowerFirstName
      const lastName = (row.original as any).lastName ?? (row.original as any).borrowerLastName
      const display =
        [firstName, lastName].filter(Boolean).join(" ").trim() || "-"
      return <div>{display}</div>
    },
  },
  {
    accessorKey: "guarantors",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Guarantor(s)" />
    ),
    cell: ({ row }) => {
      const gs = (row.getValue("guarantors") as string[]) ?? []
      return <LongText className="max-w-48">{gs.length ? gs.join(", ") : "-"}</LongText>
    },
  },
  {
    accessorKey: "loanType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Loan Type" />
    ),
    cell: ({ row }) => <div>{row.getValue("loanType") ?? "-"}</div>,
  },
  {
    accessorKey: "transactionType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Transaction Type" />
    ),
    cell: ({ row }) => <div>{row.getValue("transactionType") ?? "-"}</div>,
  },
  {
    accessorKey: "loanAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Loan Amount" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("loanAmount") as number | undefined
      if (val == null) return <div>-</div>
      const currency = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      })
      return <div>{currency.format(val)}</div>
    },
  },
  {
    accessorKey: "rate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rate" />,
    cell: ({ row }) => {
      const val = row.getValue("rate") as number | undefined
      return <div>{val != null ? `${Number(val).toFixed(3)}%` : "-"}</div>
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const badgeColor = statusClass[status] ?? ""
      return (
        <div className="flex space-x-2">
          <Badge variant="outline" className={cn("capitalize", badgeColor)}>
            {status}
          </Badge>
        </div>
      )
    },
    filterFn: "weakEquals",
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "assignedTo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assigned to" />
    ),
    cell: ({ row }) => <div>{row.getValue("assignedTo") ?? "-"}</div>,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Edited" />
    ),
    cell: ({ row }) => {
      const raw = row.getValue("updatedAt") as string | Date
      const date = typeof raw === "string" ? new Date(raw) : (raw as Date)
      return <div className="w-fit text-nowrap">{format(date, "dd MMM, yyyy")}</div>
    },
    enableSorting: false,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      const raw = row.getValue("createdAt") as string | Date
      const date = typeof raw === "string" ? new Date(raw) : (raw as Date)
      return <div className="w-fit text-nowrap">{format(date, "dd MMM, yyyy")}</div>
    },
    enableSorting: false,
  },
]


