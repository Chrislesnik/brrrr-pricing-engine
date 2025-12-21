"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "../../users/components/data-table-column-header"
import LongText from "@/components/long-text"
import { Borrower } from "../data/types"
import { format } from "date-fns"
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

export const borrowerColumns: ColumnDef<Borrower>[] = [
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
		header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
		cell: ({ row }) => <LongText className="max-w-28">{row.original.display_id}</LongText>,
		meta: { className: "w-28" },
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
	},
	{
		accessorKey: "email",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Email Address" />
		),
		cell: ({ row }) => <LongText className="max-w-56">{row.original.email ?? "-"}</LongText>,
	},
	{
		accessorKey: "primary_phone",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Primary Phone" />
		),
		cell: ({ row }) => <div className="w-fit text-nowrap">{formatUSDisplay(row.original.primary_phone)}</div>,
	},
	{
		accessorKey: "alt_phone",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Alternate Phone" />
		),
		cell: ({ row }) => <div className="w-fit text-nowrap">{formatUSDisplay(row.original.alt_phone)}</div>,
	},
	{
		accessorKey: "date_of_birth",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Date of Birth" />
		),
		cell: ({ row }) => (
			<div className="w-fit text-nowrap">
				{row.original.date_of_birth ? format(row.original.date_of_birth, "dd MMM, yyyy") : "-"}
			</div>
		),
	},
	{
		accessorKey: "fico_score",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="FICO Score" />
		),
	},
	{
		id: "assigned_to_names",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Assigned To" />
		),
		cell: ({ row }) => {
			const names = row.original.assigned_to_names ?? []
			return <LongText className="max-w-56">{names.length ? names.join(", ") : "-"}</LongText>
		},
	},
	{
		accessorKey: "created_at",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Date Created" />
		),
		cell: ({ row }) => (
			<div className="w-fit text-nowrap">
				{format(row.original.created_at, "dd MMM, yyyy")}
			</div>
		),
		enableSorting: false,
	},
	{
		id: "actions",
		header: () => <span className="sr-only">Actions</span>,
		cell: ({ row }) => {
			const b = row.original
			return <BorrowerRowActions borrower={b} />
		},
		meta: { className: "w-10 text-right" },
	},
]


