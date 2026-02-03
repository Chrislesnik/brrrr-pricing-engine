"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"
import { Button } from "@repo/ui/shadcn/button"
import { Input } from "@repo/ui/shadcn/input"
import { DataTableViewOptions } from "../../../users/components/data-table-view-options"
import { DataTableFacetedFilter } from "../../../users/components/data-table-faceted-filter"
import { IconTrash } from "@tabler/icons-react"

interface Props<TData> {
	table: Table<TData>
	placeholder?: string
	onBulkDelete?: (rows: TData[]) => Promise<void>
	bulkDeleting?: boolean
}

export function ApplicantsToolbar<TData>({ table, placeholder, onBulkDelete, bulkDeleting }: Props<TData>) {
	const isFiltered = table.getState().columnFilters.length > 0
	const selected = table.getFilteredSelectedRowModel().rows
	const canBulkDelete = onBulkDelete && selected.length > 0

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
				<Input
					placeholder={placeholder ?? "Search by ID, name, email, or phone..."}
					value={(table.getColumn("search")?.getFilterValue() as string) ?? ""}
					onChange={(event) => {
						table.getColumn("search")?.setFilterValue(event.target.value)
					}}
					className="h-9 w-full sm:w-[240px] lg:w-[250px]"
				/>
				{/* Entity Type filter (for Entities table) */}
				{(() => {
					// Some table implementations throw when a column id is missing; avoid calling getColumn directly.
					const entityTypeCol = (typeof table.getAllLeafColumns === "function"
						? table.getAllLeafColumns()
						: []
					).find((c: any) => c?.id === "entity_type")
					if (!entityTypeCol) return null
					return (
						<DataTableFacetedFilter
							column={entityTypeCol as any}
							title="Entity Type"
							options={(() => {
								const set = new Set<string>()
								const counts = new Map<string, number>()
								for (const r of table.getPreFilteredRowModel().flatRows) {
									const v = (r.getValue("entity_type") as string | undefined) ?? ""
									const val = String(v).trim()
									if (!val) continue
									set.add(val)
									counts.set(val, (counts.get(val) ?? 0) + 1)
								}
								return Array.from(set)
									.sort((a, b) => a.localeCompare(b))
									.map((n) => ({ label: n, value: n, count: counts.get(n) ?? 0 }))
							})()}
						/>
					)
				})()}
				{/* Dynamic 'Assigned To' filter when column exists */}
				{(() => {
					const assignedCol = (typeof table.getAllLeafColumns === "function"
						? table.getAllLeafColumns()
						: []
					).find((c: any) => c?.id === "assigned_to_names")
					if (!assignedCol) return null
					return (
						<DataTableFacetedFilter
							column={assignedCol as any}
							title="Assigned To"
							options={(() => {
								const set = new Set<string>()
								const counts = new Map<string, number>()
								for (const r of table.getPreFilteredRowModel().flatRows) {
									const arr = (r.getValue("assigned_to_names") as string[] | undefined) ?? []
									for (const name of arr) {
										const n = String(name).trim()
										if (!n) continue
										set.add(n)
										counts.set(n, (counts.get(n) ?? 0) + 1)
									}
								}
								return Array.from(set)
									.sort((a, b) => a.localeCompare(b))
									.map((n) => ({ label: n, value: n, count: counts.get(n) ?? 0 }))
							})()}
						/>
					)
				})()}
				{isFiltered && (
					<Button
						variant="ghost"
						onClick={() => table.resetColumnFilters()}
						className="h-8 px-2 lg:px-3"
					>
						Reset
						<Cross2Icon className="ml-2 h-4 w-4" />
					</Button>
				)}
			</div>
			<div className="flex items-center gap-2">
				{onBulkDelete && selected.length > 0 && (
					<Button
						variant="destructive"
						size="sm"
						disabled={!canBulkDelete || bulkDeleting}
						onClick={async () => {
							if (!onBulkDelete || selected.length === 0) return
							await onBulkDelete(selected.map((r) => r.original as TData))
						}}
					>
						<IconTrash className="mr-2 h-4 w-4" />
						Delete {selected.length || ""}
					</Button>
				)}
				<DataTableViewOptions table={table} />
			</div>
		</div>
	)
}


