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
	const [bulkDeleting, setBulkDeleting] = useState(false)
	// Cache organization members locally for resolving assigned_to names
	const [memberMap, setMemberMap] = useState<Map<string, string>>(new Map())

	// Reuse a single Supabase browser client for refetches
	const supabase = useMemo(() => createSupabaseBrowser(), [])

	// Load org members on mount to resolve user_id -> "First Last"
	useEffect(() => {
		let cancelled = false
		;(async () => {
			try {
				const res = await fetch("/api/org/members", { cache: "no-store" })
				if (!res.ok) return
				const j = (await res.json().catch(() => ({}))) as { members?: Array<{ user_id: string; first_name?: string | null; last_name?: string | null }> }
				const m = new Map<string, string>()
				for (const u of j.members ?? []) {
					const full = [u.first_name ?? "", u.last_name ?? ""].filter(Boolean).join(" ").trim()
					if (u.user_id) m.set(u.user_id, full || u.user_id)
				}
				if (!cancelled) setMemberMap(m)
			} catch {
				// ignore
			}
		})()
		return () => {
			cancelled = true
		}
	}, [])

	// Ensure we have names for any user ids in the provided rows. Returns an updated map.
	const resolveNamesFor = useCallback(
		async (rows: Array<{ assigned_to?: string[] }>): Promise<Map<string, string>> => {
			// Collect any user IDs that are missing from cache
			const missing = new Set<string>()
			for (const r of rows ?? []) {
				const ids = Array.isArray(r.assigned_to) ? r.assigned_to : []
				for (const id of ids) {
					if (!memberMap.has(id)) missing.add(id)
				}
			}
			if (missing.size === 0) {
				return memberMap
			}
			try {
				const q = Array.from(missing).join(",")
				const res = await fetch(`/api/org/members?includeUserIds=${encodeURIComponent(q)}`, { cache: "no-store" })
				if (!res.ok) return memberMap
				const j = (await res.json().catch(() => ({}))) as { members?: Array<{ user_id: string; first_name?: string | null; last_name?: string | null }> }
				const updated = new Map(memberMap)
				for (const u of j.members ?? []) {
					const full = [u.first_name ?? "", u.last_name ?? ""].filter(Boolean).join(" ").trim()
					if (u.user_id) updated.set(u.user_id, full || u.user_id)
				}
				setMemberMap(updated)
				return updated
			} catch {
				return memberMap
			}
		},
		[memberMap]
	)

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
					assigned_to_names: [], // will be resolved below
					created_at: r.created_at,
					updated_at: r.updated_at,
				}))
				// Resolve names for assigned_to using member cache, backfilling missing ids
				const nameMap = await resolveNamesFor(mapped)
				mapped = mapped.map((r: any) => ({
					...r,
					assigned_to_names: (Array.isArray(r.assigned_to) ? r.assigned_to : []).map((id: string) => nameMap.get(id) ?? id),
				}))
			}
			setTableData(mapped as TData[])
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [realtime?.organizationId, realtime?.table, realtime?.view, supabase, resolveNamesFor])

	const table = useReactTable({
		data: tableData,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
		},
		getRowId: (row, idx) => ((row as any).id as string | undefined) ?? String(idx),
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
		window.addEventListener("app:entities:changed", handler)
		return () => {
			window.removeEventListener("app:borrowers:changed", handler)
			window.removeEventListener("app:entities:changed", handler)
		}
	}, [refetchRows])

	return (
		<div className="space-y-4">
			<ApplicantsToolbar
				table={table}
				placeholder={toolbarPlaceholder}
				bulkDeleting={bulkDeleting}
				onBulkDelete={async (rows) => {
					if (!rows.length) return
					const type = realtime?.table === "entities" ? "entities" : "borrowers"
					const ids = rows
						.map((r: any) => (r?.id as string | undefined) ?? (r?.display_id as string | undefined))
						.filter(Boolean) as string[]
					if (!ids.length) return
					const confirmed = window.confirm(`Delete ${ids.length} ${type === "entities" ? "entit(y/ies)" : "borrower(s)"}? This cannot be undone.`)
					if (!confirmed) return
					setBulkDeleting(true)
					try {
						await Promise.all(
							ids.map((id) =>
								fetch(`/api/applicants/${type}/${encodeURIComponent(id)}`, {
									method: "DELETE",
								})
							)
						)
						setRowSelection({})
						const evName = type === "entities" ? "app:entities:changed" : "app:borrowers:changed"
						window.dispatchEvent(new Event(evName))
						await refetchRows()
					} finally {
						setBulkDeleting(false)
					}
				}}
			/>
			<div className="rounded-md border overflow-x-auto">
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


