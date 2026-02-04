"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "../../users/components/data-table-column-header"
import LongText from "@repo/ui/custom/long-text"
import { EntityProfile } from "../data/types"
import { format } from "date-fns"
import { EntityRowActions } from "./entity-row-actions"
import { Checkbox } from "@repo/ui/shadcn/checkbox"

function formatEINDisplay(ein: string | null | undefined): string {
	const digits = String(ein ?? "").replace(/\D+/g, "").slice(0, 9)
	if (!digits) return "-"
	if (digits.length <= 2) return digits
	return `${digits.slice(0, 2)}-${digits.slice(2)}`
}

function formatYmdToDisplay(ymd: string | null | undefined): string {
	const s = (ymd ?? "").toString()
	if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "-"
	const [y, m, d] = s.split("-").map((p) => Number(p))
	const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
	const mon = monthNames[(m || 1) - 1] ?? ""
	return `${String(d).padStart(2, "0")} ${mon}, ${y}`
}

export const entityColumns: ColumnDef<EntityProfile>[] = [
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
			`${row.display_id} ${row.entity_name} ${row.entity_type ?? ""} ${row.ein ?? ""}`.toLowerCase(),
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
		enableSorting: false,
	},
	{
		accessorKey: "entity_name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Entity Name" />
		),
		cell: ({ row }) => <LongText className="max-w-56">{row.original.entity_name}</LongText>,
		enableSorting: false,
	},
	{
		accessorKey: "entity_type",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Entity Type" />
		),
		// OR matching for selected entity types via faceted filter
		filterFn: (row, columnId, filterValue) => {
			const selected = Array.isArray(filterValue) ? (filterValue as string[]) : []
			if (selected.length === 0) return true
			const cell = String(row.getValue(columnId) ?? "").toLowerCase()
			return selected.some((s) => cell === String(s).toLowerCase())
		},
		enableSorting: false,
	},
	{
		accessorKey: "ein",
		header: ({ column }) => <DataTableColumnHeader column={column} title="EIN" />,
		cell: ({ row }) => (
			<div className="w-fit text-nowrap">
				{formatEINDisplay((row.original as EntityProfile).ein as any)}
			</div>
		),
		enableSorting: false,
	},
	{
		accessorKey: "date_formed",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Date Formed" />
		),
		cell: ({ row }) => {
			const display = formatYmdToDisplay(row.original.date_formed as any)
			return <div className="w-fit text-nowrap">{display}</div>
		},
		enableSorting: true,
	},
	{
		id: "assigned_to_names",
		accessorFn: (row) => (row as EntityProfile).assigned_to_names ?? [],
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Assigned To" />
		),
		cell: ({ row }) => {
			const names = row.original.assigned_to_names ?? []
			return <LongText className="max-w-56">{names.length ? names.join(", ") : "-"}</LongText>
		},
		enableSorting: false,
	},
	{
		accessorKey: "created_at",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Date Added" />
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
			const e = row.original
			return <EntityRowActions entity={e} />
		},
		meta: { className: "w-10 text-right" },
	},
]


