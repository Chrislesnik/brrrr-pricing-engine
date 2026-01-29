"use client"

import LongText from "@repo/ui/custom/long-text"
import { DataTableColumnHeader } from "../../users/components/data-table-column-header"
import { ColumnDef } from "@tanstack/react-table"

export type ApplicationRow = {
  id: string
  propertyAddress: string | null
  borrower: string | null
  guarantors: string[] | null
  status: string | null
  updatedAt: string | null
}

export const applicationsColumns: ColumnDef<ApplicationRow>[] = [
  {
    id: "search",
    accessorFn: (row) => {
      const id = (row as any).id ?? ""
      const addr = (row as any).propertyAddress ?? ""
      const borrower = (row as any).borrower ?? ""
      const gs = Array.isArray((row as any).guarantors) ? ((row as any).guarantors as string[]).join(", ") : ""
      const status = (row as any).status ?? ""
      return [id, addr, borrower, gs, status].join(" ").toLowerCase()
    },
    header: () => null,
    cell: () => null,
    enableSorting: false,
    enableHiding: true,
    meta: { className: "hidden" },
  },
  {
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Loan ID" />,
    cell: ({ row }) => <LongText className="max-w-28">{row.getValue("id") || "-"}</LongText>,
    meta: { className: "w-28" },
    enableSorting: false,
  },
  {
    accessorKey: "propertyAddress",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Property Address" />,
    cell: ({ row }) => <LongText className="max-w-[520px]">{(row.getValue("propertyAddress") as string) || "-"}</LongText>,
    enableSorting: false,
  },
  {
    accessorKey: "borrower",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Borrower" />,
    cell: ({ row }) => <LongText className="max-w-48">{(row.getValue("borrower") as string) || "-"}</LongText>,
    enableSorting: false,
  },
  {
    accessorKey: "guarantors",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Guarantor(s)" />,
    cell: ({ row }) => {
      const gs = (row.getValue("guarantors") as string[]) ?? []
      return <LongText className="max-w-48">{gs.length ? gs.join(", ") : "-"}</LongText>
    },
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <LongText className="max-w-28">{(row.getValue("status") as string) || "-"}</LongText>,
    enableSorting: false,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Edited" />,
    cell: ({ row }) => <LongText className="max-w-28">{(row.getValue("updatedAt") as string) || "-"}</LongText>,
    enableSorting: false,
  },
]


