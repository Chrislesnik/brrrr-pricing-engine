"use client"

import { format } from "date-fns"
import { ColumnDef } from "@tanstack/react-table"
import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import LongText from "@/components/long-text"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { DataTableColumnHeader } from "../../users/components/data-table-column-header"
import { LoanRow } from "../data/fetch-loans"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
      const firstName =
        // Prefer canonical keys if present, otherwise fall back to alternate names
        (row.original as { firstName?: string; borrowerFirstName?: string }).firstName ??
        (row.original as { firstName?: string; borrowerFirstName?: string }).borrowerFirstName
      const lastName =
        (row.original as { lastName?: string; borrowerLastName?: string }).lastName ??
        (row.original as { lastName?: string; borrowerLastName?: string }).borrowerLastName
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
    cell: ({ row }) => {
      const raw = (row.getValue("loanType") as string | undefined)?.toLowerCase()
      const display =
        raw === "dscr" ? "DSCR" : raw === "bridge" ? "Bridge" : raw ? raw : "-"
      return <div>{display}</div>
    },
  },
  {
    accessorKey: "transactionType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Transaction Type" />
    ),
    cell: ({ row }) => {
      const raw = (row.getValue("transactionType") as string | undefined) ?? "-"
      const title = raw === "-" ? "-" : raw.replace(/\b\w+/g, (w) => w[0].toUpperCase() + w.slice(1))
      return <div>{title}</div>
    },
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
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => {
      const loanId = row.original.id
      const opposite = row.original.status === "active" ? "Dead" : "Active"
      return (
        <div className="flex justify-end">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <DotsHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Open actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem onClick={() => table.options.meta?.openPricingEngine?.(loanId)}>
                Pricing Engine
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.options.meta?.openTermSheets?.(loanId)}>
                Term Sheets
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.options.meta?.toggleStatus?.(loanId)}>
                {`Set to ${opposite}`}
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete loan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove this loan from the pipeline.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => table.options.meta?.deleteLoan?.(loanId)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
    meta: { className: "w-10 text-right" },
  },
]


