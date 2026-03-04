"use client"

import Link from "next/link"
import { useState, useEffect, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Table as TTable } from "@tanstack/react-table"
import { Plus, SlidersHorizontal, ArrowUpDown, Kanban } from "lucide-react"
import { Button } from "@repo/ui/shadcn/button"
import { Input } from "@repo/ui/shadcn/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select"
import { DataTableFacetedFilter } from "../../users/components/data-table-faceted-filter"
import { DataGridFilterMenu } from "@/components/data-grid/data-grid-filter-menu"
import { cn } from "@repo/lib/cn"
import { LoanRow } from "../data/fetch-loans"

interface Props<TData> {
  table: TTable<TData>
}

export function PipelineToolbar({ table }: Props<LoanRow>) {
  const isFiltered = table.getState().columnFilters.length > 0

  // Build dynamic options for Assigned To from visible dataset
  const assignedOptions = (() => {
    const set = new Set<string>()
    const counts = new Map<string, number>()
    const rows = table.getPreFilteredRowModel().flatRows
    for (const r of rows) {
      const v = (r.getValue("assignedTo") as string | null) || ""
      if (!v) continue
      for (const name of v.split(",")) {
        const n = name.trim()
        if (n) {
          set.add(n)
          counts.set(n, (counts.get(n) ?? 0) + 1)
        }
      }
    }
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((n) => ({ label: n, value: n, count: counts.get(n) ?? 0 }))
  })()

  return (
    <div className="flex items-center gap-2">
      <div className="flex min-w-0 flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
        <Input
          placeholder="Search by ID, property address, borrower, or guarantor..."
          value={
            (table.getColumn("search")?.getFilterValue() as string) ??
            ""
          }
          onChange={(event) => {
            table.getColumn("search")?.setFilterValue(event.target.value)
          }}
          className="h-9 w-full flex-shrink-0 sm:w-[240px] lg:w-[250px]"
        />
        <div className="flex min-w-0 flex-wrap gap-2 sm:gap-x-2">
          {table.getColumn("loan_type") && (
            <DataTableFacetedFilter
              column={table.getColumn("loan_type")}
              title="Loan Type"
              options={[
                { label: "DSCR", value: "dscr" },
                { label: "Bridge", value: "bridge" },
              ]}
            />
          )}
          {table.getColumn("transaction_type") && (
            <DataTableFacetedFilter
              column={table.getColumn("transaction_type")}
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
                { label: "Inactive", value: "inactive" },
                { label: "Archived", value: "archived" },
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
            className="h-8 flex-shrink-0 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <DataGridFilterMenu table={table} />
        <PipelineDisplaySettings table={table} />
        <Button size="sm" className="h-8" asChild>
          <Link href="/pricing">
            <Plus className="mr-2 h-4 w-4" />
            New Loan
          </Link>
        </Button>
      </div>
    </div>
  )
}

const COLUMN_NAME_MAP: Record<string, string> = {
  id: "ID",
  search: "Search",
  propertyAddress: "Property Address",
  borrower: "Borrower",
  guarantors: "Guarantors",
  loanType: "Loan Type",
  loan_type: "Loan Type",
  transactionType: "Transaction Type",
  transaction_type: "Transaction Type",
  loanAmount: "Loan Amount",
  rate: "Rate",
  assignedTo: "Assigned To",
  updatedAt: "Updated At",
  createdAt: "Created At",
  status: "Status",
}

function formatColumnName(id: string): string {
  if (COLUMN_NAME_MAP[id]) return COLUMN_NAME_MAP[id]
  const spaced = id
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
  return spaced.replace(/\b\w/g, (m) => m.toUpperCase())
}

const displaySelectCls =
  "h-7 w-auto min-w-0 rounded-md border bg-muted/60 px-2 text-xs [&>svg]:h-3 [&>svg]:w-3 gap-1"

function PipelineDisplaySettings({ table }: { table: TTable<LoanRow> }) {
  const [open, setOpen] = useState(false)
  const [groupBy, setGroupBy] = useState("none")
  const [subGroupBy, setSubGroupBy] = useState("none")
  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        popRef.current?.contains(target) ||
        btnRef.current?.contains(target) ||
        (target instanceof Element &&
          (target.closest("[data-radix-popper-content-wrapper]") ||
            target.closest("[role='listbox']") ||
            target.closest("[role='option']")))
      ) return
      setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const popoverWidth = 300
      const rightOverflow = rect.left + popoverWidth - window.innerWidth
      const left = rightOverflow > 0 ? rect.left - rightOverflow - 8 : rect.left
      setPos({ top: rect.bottom + 4, left })
    }
  }, [open])

  const toggleableColumns = useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          (col) =>
            typeof col.accessorFn !== "undefined" && col.getCanHide()
        ),
    [table]
  )

  const sorting = table.getState().sorting
  const currentSortId = sorting[0]?.id ?? ""
  const currentSortAsc = sorting[0]?.desc === false

  const sortableColumns = useMemo(
    () =>
      table
        .getAllColumns()
        .filter((col) => col.getCanSort())
        .map((col) => ({
          id: col.id,
          label: formatColumnName(col.id),
        })),
    [table]
  )

  const groupableColumns = useMemo(
    () => [
      { value: "none", label: "None" },
      ...sortableColumns.map((col) => ({ value: col.id, label: col.label })),
    ],
    [sortableColumns]
  )

  return (
    <div className="relative">
      <Button
        ref={btnRef}
        variant="outline"
        onClick={() => setOpen(!open)}
        className="h-8 font-normal"
      >
        <SlidersHorizontal className="text-muted-foreground" />
        Display
      </Button>

      {open &&
        createPortal(
          <div
            ref={popRef}
            className="fixed z-[9999] w-[300px] rounded-lg border bg-card shadow-lg"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="px-3 py-3 space-y-2.5">
              {/* Grouping */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Kanban className="h-3.5 w-3.5" />
                  <span>Grouping</span>
                </div>
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger className={displaySelectCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    {groupableColumns.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sub-grouping */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Kanban className="h-3.5 w-3.5" />
                  <span>Sub-grouping</span>
                </div>
                <Select value={subGroupBy} onValueChange={setSubGroupBy}>
                  <SelectTrigger className={displaySelectCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    {groupableColumns.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ordering */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span>Ordering</span>
                </div>
                <div className="flex items-center gap-1">
                  <Select
                    value={currentSortId || "__none__"}
                    onValueChange={(v) => {
                      if (v === "__none__") {
                        table.setSorting([])
                      } else {
                        table.setSorting([{ id: v, desc: !currentSortAsc }])
                      }
                    }}
                  >
                    <SelectTrigger className={displaySelectCls}>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="__none__" className="text-xs">None</SelectItem>
                      {sortableColumns.map((col) => (
                        <SelectItem key={col.id} value={col.id} className="text-xs">
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentSortId && (
                    <button
                      onClick={() => {
                        table.setSorting([{ id: currentSortId, desc: currentSortAsc }])
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md border bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                      title={currentSortAsc ? "Ascending" : "Descending"}
                    >
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t" />

            {/* Display properties */}
            <div className="px-3 py-3">
              <p className="text-[11px] font-semibold text-muted-foreground mb-2">Display properties</p>
              <div className="flex flex-wrap gap-1.5">
                {toggleableColumns.map((col) => {
                  const visible = col.getIsVisible()
                  return (
                    <button
                      key={col.id}
                      onClick={() => col.toggleVisibility(!visible)}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                        visible
                          ? "border-primary/30 bg-primary/10 text-foreground"
                          : "border-transparent bg-muted/60 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {formatColumnName(col.id)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Reset */}
            <div className="border-t px-3 py-2.5 flex justify-center">
              <button
                onClick={() => {
                  table.setSorting([])
                  setGroupBy("none")
                  setSubGroupBy("none")
                  toggleableColumns.forEach((col) => col.toggleVisibility(true))
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Reset display
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
