"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { DataGrid } from "@/components/data-grid/data-grid"
import { useDataGrid } from "@/hooks/use-data-grid"
import { cn } from "@/lib/utils"

export interface UnitRow {
  id: string
  unitNumber: string
  leased: "yes" | "no" | undefined
  gross: string
  market: string
}

interface LeasedUnitsGridProps {
  data: UnitRow[]
  onDataChange: (data: UnitRow[]) => void
  className?: string
}

const unitColumns: ColumnDef<UnitRow>[] = [
  {
    id: "unitNumber",
    accessorKey: "unitNumber",
    header: "#",
    meta: { cell: { variant: "short-text" } },
    size: 50,
    minSize: 40,
    maxSize: 60,
    enableResizing: false,
  },
  {
    id: "leased",
    accessorKey: "leased",
    header: () => (
      <span>
        Leased <span className="text-red-600">*</span>
      </span>
    ),
    meta: {
      cell: {
        variant: "select",
        options: [
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ],
      },
    },
    size: 100,
    minSize: 80,
    maxSize: 140,
  },
  {
    id: "gross",
    accessorKey: "gross",
    header: () => (
      <span>
        Gross Rent <span className="text-red-600">*</span>
      </span>
    ),
    meta: { cell: { variant: "currency-calc" } },
    size: 140,
    minSize: 100,
    maxSize: 200,
  },
  {
    id: "market",
    accessorKey: "market",
    header: () => (
      <span>
        Market Rent <span className="text-red-600">*</span>
      </span>
    ),
    meta: { cell: { variant: "currency-calc" } },
    size: 140,
    minSize: 100,
    maxSize: 200,
  },
]

export function LeasedUnitsGrid({ data, onDataChange, className }: LeasedUnitsGridProps) {
  // Custom onDataChange that prevents changes to unitNumber column
  const handleDataChange = React.useCallback(
    (newData: UnitRow[]) => {
      // Ensure unit numbers stay consistent with indices
      const dataWithPreservedUnitNumbers = newData.map((row, idx) => ({
        ...row,
        id: `unit-${idx}`,
        unitNumber: `#${idx + 1}`,
      }))
      onDataChange(dataWithPreservedUnitNumbers)
    },
    [onDataChange]
  )

  const dataGrid = useDataGrid({
    data,
    columns: unitColumns,
    onDataChange: handleDataChange,
    readOnly: false,
    enableSearch: false,
    enablePaste: false,
    rowHeight: "short",
    getRowId: (row) => row.id,
  })

  // Calculate dynamic height based on number of rows (min 1 row, max 10 rows visible)
  const rowCount = data.length
  const rowHeightPx = 36 // "short" row height
  const headerHeight = 36
  const calculatedHeight = Math.min(400, headerHeight + rowCount * rowHeightPx + 4)

  if (data.length === 0) {
    return (
      <div className={cn("text-muted-foreground text-sm py-4", className)}>
        Select Property Type and Number of Units to add unit rows.
      </div>
    )
  }

  return (
    <div className={cn("rounded-md border", className)}>
      <DataGrid
        {...dataGrid}
        height={calculatedHeight}
        stretchColumns
        className="[&_[data-slot=grid-header]]:bg-muted/50"
      />
    </div>
  )
}
