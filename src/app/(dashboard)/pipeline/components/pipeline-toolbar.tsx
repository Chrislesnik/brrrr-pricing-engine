"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "../../users/components/data-table-view-options"
import { DataTableFacetedFilter } from "../../users/components/data-table-faceted-filter"
import { LoanRow } from "../data/fetch-loans"

interface Props<TData> {
  table: Table<TData>
}

export function PipelineToolbar({ table }: Props<LoanRow>) {
  const isFiltered = table.getState().columnFilters.length > 0

  // Build dynamic options for Assigned To from visible dataset
  const assignedOptions = (() => {
    const set = new Set<string>()
    const rows = table.getPreFilteredRowModel().flatRows
    for (const r of rows) {
      const v = (r.getValue("assignedTo") as string | null) || ""
      if (!v) continue
      for (const name of v.split(",")) {
        const n = name.trim()
        if (n) set.add(n)
      }
    }
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((n) => ({ label: n, value: n }))
  })()

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
        <Input
          placeholder="Search by ID, property address, borrower, or guarantor..."
          value={
            (table.getColumn("search")?.getFilterValue() as string) ??
            ""
          }
          onChange={(event) => {
            table.getColumn("search")?.setFilterValue(event.target.value)
          }}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <div className="flex gap-x-2">
          {table.getColumn("loanType") && (
            <DataTableFacetedFilter
              column={table.getColumn("loanType")}
              title="Loan Type"
              options={[
                { label: "DSCR", value: "dscr" },
                { label: "Bridge", value: "bridge" },
              ]}
            />
          )}
          {table.getColumn("transactionType") && (
            <DataTableFacetedFilter
              column={table.getColumn("transactionType")}
              title="Transaction Type"
              options={[
                { label: "Purchase", value: "purchase" },
                { label: "Delayed Purchase", value: "delayed-purchase" },
                { label: "Refinance Rate/Term", value: "rt-refi" },
                { label: "Refinance Cash Out", value: "co-refi" },
              ]}
            />
          )}
          {table.getColumn("status") && (
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
              options={[
                { label: "Active", value: "active" },
                { label: "Dead", value: "dead" },
              ]}
            />
          )}
          {table.getColumn("assignedTo") && assignedOptions.length > 0 && (
            <DataTableFacetedFilter
              column={table.getColumn("assignedTo")}
              title="Assigned To"
              options={assignedOptions}
            />
          )}
        </div>
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


