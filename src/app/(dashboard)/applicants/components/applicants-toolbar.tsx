"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "../../users/components/data-table-view-options"

interface Props<TData> {
	table: Table<TData>
	placeholder?: string
}

export function ApplicantsToolbar<TData>({ table, placeholder }: Props<TData>) {
	const isFiltered = table.getState().columnFilters.length > 0

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
			<DataTableViewOptions table={table} />
		</div>
	)
}


