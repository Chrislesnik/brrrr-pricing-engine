"use client"

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { MixerHorizontalIcon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface Props<TData> {
  table: Table<TData>
}

export function DataTableViewOptions<TData>({ table }: Props<TData>) {
  const toTitle = (id: string): string => {
    const map: Record<string, string> = {
      id: "ID",
      search: "Search",
      propertyAddress: "Property Address",
      borrower: "Borrower",
      guarantors: "Guarantors",
      loanType: "Loan Type",
      transactionType: "Transaction Type",
      loanAmount: "Loan Amount",
      rate: "Rate",
      assignedTo: "Assigned To",
      updatedAt: "Updated At",
      createdAt: "Created At",
    }
    if (map[id]) return map[id]
    // Fallback: convert camelCase/PascalCase/snake_case to Title Case
    const spaced = id
      .replace(/[_-]+/g, " ")
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .toLowerCase()
    return spaced.replace(/\b\w/g, (m) => m.toUpperCase())
  }
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
          <MixerHorizontalIcon className="mr-2 h-4 w-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" &&
              column.getCanHide() &&
              column.id !== "search"
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className=""
                checked={column.getIsVisible()}
                // Keep menu open after toggling
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {toTitle(column.id)}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
