"use client"

import * as React from "react"
import { useDataGrid } from "@/hooks/use-data-grid"
import { DataGrid } from "@/components/data-grid/data-grid"
import { DataGridKeyboardShortcuts } from "@/components/data-grid/data-grid-keyboard-shortcuts"
import { cn } from "@repo/lib/cn"
import type { ColumnDef } from "@tanstack/react-table"

export interface UnitRow {
  id: string
  unitNumber: string
  leased: "yes" | "no" | undefined
  gross: string
  market: string
}

const unitColumns: ColumnDef<UnitRow>[] = [
  {
    id: "unitNumber",
    accessorKey: "unitNumber",
    header: () => <span className="font-medium text-muted-foreground">#</span>,
    size: 50,
    minSize: 50,
    maxSize: 50,
    enableResizing: false,
    enableSorting: false,
    enableColumnFilter: false,
    meta: {
      cell: { variant: "short-text" as const },
      readOnly: true,
    },
  },
  {
    id: "leased",
    accessorKey: "leased",
    header: () => <span className="font-medium">Leased <span className="text-red-600">*</span></span>,
    size: 100,
    minSize: 80,
    enableSorting: false,
    enableColumnFilter: false,
    meta: {
      cell: {
        variant: "select" as const,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
    },
  },
  {
    id: "gross",
    accessorKey: "gross",
    header: () => <span className="font-medium">Gross Rent <span className="text-red-600">*</span></span>,
    size: 120,
    minSize: 100,
    enableSorting: false,
    enableColumnFilter: false,
    meta: {
      cell: { variant: "currency-calc" as const },
    },
  },
  {
    id: "market",
    accessorKey: "market",
    header: () => <span className="font-medium">Market Rent <span className="text-red-600">*</span></span>,
    size: 120,
    minSize: 100,
    enableSorting: false,
    enableColumnFilter: false,
    meta: {
      cell: { variant: "currency-calc" as const },
    },
  },
]

interface LeasedUnitsGridProps {
  data: UnitRow[]
  onDataChange: React.Dispatch<React.SetStateAction<UnitRow[]>>
  className?: string
}

export function LeasedUnitsGrid({ data, onDataChange, className }: LeasedUnitsGridProps) {
  const { table, focusCell, ...gridProps } = useDataGrid({
    data,
    columns: unitColumns,
    onDataChange: onDataChange,
    getRowId: (row) => row.id,
    enableSearch: false,
    enablePaste: true,
    rowHeight: "short",
    autoFocus: false, // Don't steal focus on mount
  })

  if (data.length === 0) {
    return (
      <div className={cn("text-muted-foreground text-sm py-4", className)}>
        Select Property Type and Number of Units to add unit rows.
      </div>
    )
  }

  // Calculate height: header (36px) + rows (36px each) + border (2px)
  const gridHeight = 36 + (data.length * 36) + 2

  return (
    <div className={cn("w-full", className)}>
      <DataGridKeyboardShortcuts enableSearch={!!gridProps.searchState} />
      <DataGrid
        table={table}
        {...gridProps}
        stretchColumns
        height={gridHeight}
      />
    </div>
  )
}
