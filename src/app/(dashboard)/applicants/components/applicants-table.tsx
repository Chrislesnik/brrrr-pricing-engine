"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
	ColumnDef,
	ColumnFiltersState,
	RowData,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "../../users/components/data-table-pagination"
import { ApplicantsToolbar } from "./applicants-toolbar"
import { createSupabaseBrowser } from "@/lib/supabase-browser"

declare module "@tanstack/react-table" {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData extends RowData, TValue> {
		className: string
	}
}

interface Props<TData> {
	columns: ColumnDef<TData>[]
	data: TData[]
	toolbarPlaceholder?: string
	realtime?: {
		table: "borrowers" | "entities"
		view: "borrowers" | "entities" | "borrowers_view" | "entities_view"
		organizationId: string
	}
	// Optional default column visibility per page/table (e.g., hide alt_phone by default)
	defaultVisibility?: VisibilityState
}

export function ApplicantsTable<TData>({
	columns,
	data,
	toolbarPlaceholder,
	realtime,
	defaultVisibility,
}: Props<TData>) {
	const [tableData, setTableData] = useState<TData[]>(data)
	const [rowSelection, setRowSelection] = useState({})
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
		search: false,
		...(defaultVisibility ?? {}),
	})
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [sorting, setSorting] = useState<SortingState>([])

	// Reuse a single Supabase browser client for refetches
	const supabase = useMemo(() => createSupabaseBrowser(), [])

	// Helper: refetch current rows (used by realtime subscription and manual refresh events)
	const refetchRows = useCallback(async () => {
		if (!realtime?.organizationId || !realtime?.table || !realtime?.view) return
		const { data: rows } = await supabase
			.from(realtime.view)
			.select("*")
			.eq("organization_id", realtime.organizationId)
			.order("created_at", { ascending: false })
		if (rows) {
			let mapped: any[] = rows as any[]
			// Shape raw base-table rows to table-friendly structure when not using a view
			if (realtime.view === "borrowers") {
				mapped = (rows as any[]).map((r: any) => ({
					id: r.id,
					display_id: r.display_id ?? r.id,
					first_name: r.first_name,
					last_name: r.last_name,
					email: r.email ?? null,
					primary_phone: r.primary_phone ?? null,
					alt_phone: r.alt_phone ?? null,
					date_of_birth: r.date_of_birth ?? null,
					fico_score: r.fico_score ?? null,
					organization_id: r.organization_id,
					assigned_to: Array.isArray(r.assigned_to) ? r.assigned_to : [],
					assigned_to_names: [], // names resolved on initial server load
					created_at: r.created_at,
					updated_at: r.updated_at,
				}))
			}
			setTableData(mapped as TData[])
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [realtime?.organizationId, realtime?.table, realtime?.view, supabase])

	const table = useReactTable({
		data: tableData,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
		},
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	})

	// Realtime subscription
	useEffect(() => {
		if (!realtime?.organizationId || !realtime?.table || !realtime?.view) return

		const channel = supabase
			.channel(`realtime:${realtime.table}:${realtime.organizationId}`)
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: realtime.table, filter: `organization_id=eq.${realtime.organizationId}` },
				() => {
					void refetchRows()
				}
			)
			.subscribe()

		// Initial refetch to ensure freshness
		void refetchRows()

		return () => {
			void supabase.removeChannel(channel)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [realtime?.organizationId, realtime?.table, realtime?.view, refetchRows])

	// Listen for manual refresh events fired by other components (e.g., after saving a borrower)
	useEffect(() => {
		const handler = () => {
			void refetchRows()
		}
		window.addEventListener("app:borrowers:changed", handler)
		return () => window.removeEventListener("app:borrowers:changed", handler)
	}, [refetchRows])

	return (
		<div className="space-y-4">
			<ApplicantsToolbar table={table} placeholder={toolbarPlaceholder} />
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead
											key={header.id}
											colSpan={header.colSpan}
											className={header.column.columnDef.meta?.className ?? ""}
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext()
												  )}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className={cell.column.columnDef.meta?.className ?? ""}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									No results.
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


