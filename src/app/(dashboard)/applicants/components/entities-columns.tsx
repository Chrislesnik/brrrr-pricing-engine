"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "../../users/components/data-table-column-header"
import LongText from "@/components/long-text"
import { EntityProfile } from "../data/types"
import { format } from "date-fns"

export const entityColumns: ColumnDef<EntityProfile>[] = [
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
	},
	{
		accessorKey: "entity_name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Entity Name" />
		),
		cell: ({ row }) => <LongText className="max-w-56">{row.original.entity_name}</LongText>,
	},
	{
		accessorKey: "entity_type",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Entity Type" />
		),
	},
	{
		accessorKey: "ein",
		header: ({ column }) => <DataTableColumnHeader column={column} title="EIN" />,
	},
	{
		accessorKey: "date_formed",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Date Formed" />
		),
		cell: ({ row }) => (
			<div className="w-fit text-nowrap">
				{row.original.date_formed ? format(row.original.date_formed, "dd MMM, yyyy") : "-"}
			</div>
		),
		enableSorting: false,
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
			<DataTableColumnHeader column={column} title="Date Added" />
		),
		cell: ({ row }) => (
			<div className="w-fit text-nowrap">
				{format(row.original.created_at, "dd MMM, yyyy")}
			</div>
		),
		enableSorting: false,
	},
]


