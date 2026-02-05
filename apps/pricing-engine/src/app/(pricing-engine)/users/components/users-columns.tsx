"use client"

import { format } from "date-fns"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { cn } from "@repo/lib/cn"
import { Badge } from "@repo/ui/shadcn/badge"
import { Button } from "@repo/ui/shadcn/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu"
import LongText from "@repo/ui/custom/long-text"
import { callTypes } from "../data/data"
import { User } from "../data/schema"
import { DataTableColumnHeader } from "./data-table-column-header"

type TableMetaActions = {
  openPricingEngine: (id: string) => void
  openTermSheets: (id: string) => void
  toggleStatus: (id: string) => void
}

const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    cell: ({ row }) => (
      <Button variant="link" className="underline" asChild>
        <Link href={`/users/${row.original.id}`}>
          <LongText className="max-w-28">{row.original.id}</LongText>
        </Link>
      </Button>
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
        {row.getValue("propertyAddress")}
      </LongText>
    ),
  },
  {
    id: "borrower",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Borrower" />
    ),
    cell: ({ row }) => {
      const { firstName, lastName } = row.original
      return <div>{`${firstName} ${lastName}`}</div>
    },
  },
  {
    accessorKey: "guarantors",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Guarantor(s)" />
    ),
    cell: ({ row }) => {
      const gs = row.getValue("guarantors") as string[]
      return <LongText className="max-w-48">{gs?.join(", ") || "-"}</LongText>
    },
  },
  {
    accessorKey: "loanType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Loan Type" />
    ),
  },
  {
    accessorKey: "transactionType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Transaction Type" />
    ),
  },
  {
    accessorKey: "loanAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Loan Amount" />
    ),
    cell: ({ row }) => <div>{currency.format(row.getValue("loanAmount"))}</div>,
  },
  {
    accessorKey: "rate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rate" />,
    cell: ({ row }) => <div>{Number(row.getValue("rate")).toFixed(3)}%</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const badgeColor = callTypes.get(row.original.status)
      return (
        <div className="flex space-x-2">
          <Badge variant="outline" className={cn("capitalize", badgeColor)}>
            {row.getValue("status")}
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
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Edited" />
    ),
    cell: ({ row }) => (
      <div className="w-fit text-nowrap">
        {format(new Date(row.getValue("updatedAt")), "dd MMM, yyyy")}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => (
      <div className="w-fit text-nowrap">
        {format(new Date(row.getValue("createdAt")), "dd MMM, yyyy")}
      </div>
    ),
    enableSorting: false,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => (
      <div className="flex justify-end">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <DotsHorizontalIcon className="h-4 w-4" />
              <span className="sr-only">Open actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem
              onClick={() =>
                (table.options.meta as Partial<TableMetaActions> | undefined)?.openPricingEngine?.(
                  row.original.id
                )
              }
            >
              Pricing Engine
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                (table.options.meta as Partial<TableMetaActions> | undefined)?.openTermSheets?.(
                  row.original.id
                )
              }
            >
              Term Sheets
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                (table.options.meta as Partial<TableMetaActions> | undefined)?.toggleStatus?.(
                  row.original.id
                )
              }
            >
              {`Switch to ${row.original.status === "active" ? "Dead" : "Active"}`}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    meta: { className: "w-10 text-right" },
  },
]
