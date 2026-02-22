"use client"

import { Table } from "@tanstack/react-table"
import { ChevronDown, Columns2 } from "lucide-react"
import { Button } from "@repo/ui/shadcn/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu"

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
          <Columns2 className="w-4 h-4 mr-2" />
          <span className="text-xs font-medium">Customize Columns</span>
          <ChevronDown className="w-4 h-4 ml-2" />
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
