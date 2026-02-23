"use client"

import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@repo/lib/cn"
import type { TableConfig, TableColumnDef } from "@/types/table-config"

// --- Currency formatting helpers ---

function normalizeMoneyRaw(s: string): string {
  let raw = s.replace(/[^\d.]/g, "")
  const firstDot = raw.indexOf(".")
  if (firstDot !== -1) {
    const left = raw.slice(0, firstDot)
    const right = raw.slice(firstDot + 1).replace(/\./g, "")
    raw = `${left}.${right.slice(0, 2)}`
  }
  return raw
}

function formatMoneyLive(raw: string): string {
  if (!raw) return ""
  const hasDot = raw.includes(".")
  const [intRaw = "", decRaw = ""] = raw.split(".")
  const int = (intRaw || "0").replace(/^0+(?=\d)/, "") || "0"
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  if (hasDot) return `$${withCommas}.${decRaw}`
  return `$${withCommas}`
}

function significantCharsBefore(s: string, pos: number): number {
  let count = 0
  for (let i = 0; i < pos; i++) {
    if (/[\d.]/.test(s[i])) count++
  }
  return count
}

function caretFromSignificantChars(formatted: string, count: number): number {
  let seen = 0
  for (let i = 0; i < formatted.length; i++) {
    if (/[\d.]/.test(formatted[i])) {
      seen++
      if (seen === count) return i + 1
    }
  }
  return formatted.length
}

// --- Expression / calc helpers ---

function isSafeExpression(expression: string): boolean {
  if (!/^[0-9+\-*/().\s]*$/.test(expression)) return false
  let depth = 0
  for (const ch of expression) {
    if (ch === "(") depth++
    else if (ch === ")") {
      depth--
      if (depth < 0) return false
    }
  }
  return depth === 0 && expression.trim().length > 0
}

// --- Style constants ---

const CELL = "h-9 border-r border-b text-sm last:border-r-0"
const CELL_INPUT =
  "h-full w-full border-0 bg-transparent text-sm outline-none ring-0 focus:bg-accent/40 focus:ring-2 focus:ring-ring focus:z-10 focus:relative px-2"
const HEADER_CELL =
  "h-9 border-r border-b bg-muted/60 text-center text-[11px] font-semibold text-muted-foreground last:border-r-0 select-none"
const TOGGLE_BTN =
  "h-full w-full border-0 bg-transparent text-center text-sm font-medium outline-none ring-0 focus:bg-accent/40 focus:ring-2 focus:ring-ring cursor-pointer select-none hover:bg-muted/60 transition-colors"

// --- CalcMoneyInput (currency cell with = expression support) ---

function CalcMoneyInput({
  value,
  onValueCommit,
  placeholder,
  cellProps,
  onCellKeyDown,
}: {
  value: string
  onValueCommit: (raw: string) => void
  placeholder?: string
  cellProps: Record<string, unknown>
  onCellKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void
}) {
  const [calcMode, setCalcMode] = useState(false)
  const [expr, setExpr] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const resolveExpression = useCallback(() => {
    const trimmed = expr.trim()
    if (!isSafeExpression(trimmed)) return
    try {
      const result = Function(`"use strict"; return (${trimmed});`)()
      if (typeof result === "number" && Number.isFinite(result)) {
        const normalized = normalizeMoneyRaw(String(result))
        onValueCommit(normalized)
        setCalcMode(false)
        setExpr("")
      }
    } catch { /* ignore */ }
  }, [expr, onValueCommit])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const el = e.target
      const v = el.value

      if (calcMode) {
        if (!v.startsWith("=")) {
          setCalcMode(false)
          setExpr("")
          const sanitized = normalizeMoneyRaw(v)
          onValueCommit(sanitized)
        } else {
          setExpr(v.slice(1))
        }
        return
      }

      const pos = el.selectionStart ?? v.length
      const sc = significantCharsBefore(v, pos)
      const sanitized = normalizeMoneyRaw(v)
      onValueCommit(sanitized)
      const formatted = formatMoneyLive(sanitized)
      requestAnimationFrame(() => {
        if (inputRef.current) {
          try {
            const newPos = caretFromSignificantChars(formatted, sc)
            inputRef.current.setSelectionRange(newPos, newPos)
          } catch { /* */ }
        }
      })
    },
    [calcMode, onValueCommit],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (calcMode) {
        if (e.key === "Enter" || e.key === "Return") {
          e.preventDefault()
          resolveExpression()
          return
        }
        if (e.key === "Escape") {
          e.preventDefault()
          setCalcMode(false)
          setExpr("")
          return
        }
        if (e.key === "Tab") {
          resolveExpression()
          onCellKeyDown(e)
          return
        }
        return
      }

      if (e.key === "=") {
        e.preventDefault()
        setCalcMode(true)
        setExpr("")
        return
      }

      onCellKeyDown(e)
    },
    [calcMode, resolveExpression, onCellKeyDown],
  )

  const displayValue = calcMode ? `=${expr}` : formatMoneyLive(value)

  return (
    <div className={calcMode ? "ring-[3px] ring-purple-500 h-full relative z-10" : "h-full"}>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={CELL_INPUT}
        data-grid-cell={cellProps["data-grid-cell"]}
        data-row={cellProps["data-row"]}
        data-col={cellProps["data-col"]}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}

// --- ConfigurableGrid ---

export interface ConfigurableGridProps {
  config: TableConfig
  data: Record<string, unknown>[]
  onDataChange: (data: Record<string, unknown>[]) => void
  rowCount?: number
  className?: string
}

export function ConfigurableGrid({
  config,
  data,
  onDataChange,
  rowCount: rowCountProp,
  className,
}: ConfigurableGridProps) {
  const gridRef = useRef<HTMLTableElement>(null)
  const { columns, row_label_template } = config
  const hasRowLabel = !!row_label_template

  const effectiveRowCount =
    config.row_source.type === "fixed"
      ? config.row_source.count
      : (rowCountProp ?? 0)

  // Resize data array to match row count
  useEffect(() => {
    if (effectiveRowCount <= 0) {
      if (data.length > 0) onDataChange([])
      return
    }
    if (data.length !== effectiveRowCount) {
      const next = Array.from({ length: effectiveRowCount }, (_, i) => data[i] ?? {})
      onDataChange(next)
    }
  }, [effectiveRowCount]) // eslint-disable-line react-hooks/exhaustive-deps

  // First navigable column index (skip read-only row label)
  const firstNavCol = hasRowLabel ? 1 : 0
  const totalCols = (hasRowLabel ? 1 : 0) + columns.length
  const lastNavCol = totalCols - 1

  const findNavColType = (colIdx: number): TableColumnDef["type"] | "label" => {
    if (hasRowLabel && colIdx === 0) return "label"
    const defIdx = hasRowLabel ? colIdx - 1 : colIdx
    return columns[defIdx]?.type ?? "text"
  }

  const isColNavigable = (colIdx: number): boolean => {
    const t = findNavColType(colIdx)
    return t !== "label" && t !== "readonly"
  }

  const nextNavCol = (from: number, dir: 1 | -1): number | null => {
    let c = from + dir
    while (c >= firstNavCol && c <= lastNavCol) {
      if (isColNavigable(c)) return c
      c += dir
    }
    return null
  }

  const focusCell = useCallback(
    (rowIdx: number, colIdx: number) => {
      if (!gridRef.current) return
      const cells = gridRef.current.querySelectorAll<HTMLElement>("tbody [data-grid-cell]")
      const target = Array.from(cells).find(
        (el) => el.dataset.row === String(rowIdx) && el.dataset.col === String(colIdx),
      )
      if (target) {
        target.focus()
        if (target instanceof HTMLInputElement) target.select()
      }
    },
    [],
  )

  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      const el = e.currentTarget as HTMLElement
      const row = Number(el.dataset.row ?? 0)
      const col = Number(el.dataset.col ?? 0)
      const maxRow = effectiveRowCount - 1
      const isInput = el instanceof HTMLInputElement
      const isButton = el instanceof HTMLButtonElement

      switch (e.key) {
        case "Tab": {
          e.preventDefault()
          if (e.shiftKey) {
            const prev = nextNavCol(col, -1)
            if (prev !== null) focusCell(row, prev)
            else if (row > 0) {
              const last = nextNavCol(lastNavCol + 1, -1)
              if (last !== null) focusCell(row - 1, last)
            }
          } else {
            const next = nextNavCol(col, 1)
            if (next !== null) focusCell(row, next)
            else if (row < maxRow) {
              const first = nextNavCol(firstNavCol - 1, 1)
              if (first !== null) focusCell(row + 1, first)
            }
          }
          break
        }
        case "Enter": {
          if (isButton) break
          e.preventDefault()
          if (e.shiftKey) {
            if (row > 0) focusCell(row - 1, col)
          } else {
            if (row < maxRow) focusCell(row + 1, col)
          }
          break
        }
        case " ": {
          if (isButton) break
          break
        }
        case "ArrowUp": {
          e.preventDefault()
          if (row > 0) focusCell(row - 1, col)
          break
        }
        case "ArrowDown": {
          e.preventDefault()
          if (row < maxRow) focusCell(row + 1, col)
          break
        }
        case "ArrowLeft": {
          if (isButton) {
            e.preventDefault()
            const prev = nextNavCol(col, -1)
            if (prev !== null) focusCell(row, prev)
          } else if (isInput) {
            const atStart = el.selectionStart === 0 && el.selectionEnd === 0
            if (atStart) {
              const prev = nextNavCol(col, -1)
              if (prev !== null) {
                e.preventDefault()
                focusCell(row, prev)
              }
            }
          }
          break
        }
        case "ArrowRight": {
          if (isButton) {
            e.preventDefault()
            const next = nextNavCol(col, 1)
            if (next !== null) focusCell(row, next)
          } else if (isInput) {
            const atEnd = el.selectionStart === el.value.length
            if (atEnd) {
              const next = nextNavCol(col, 1)
              if (next !== null) {
                e.preventDefault()
                focusCell(row, next)
              }
            }
          }
          break
        }
        case "Escape": {
          el.blur()
          break
        }
      }
    },
    [effectiveRowCount, focusCell, firstNavCol, lastNavCol, nextNavCol],
  )

  const cellProps = useCallback(
    (rowIdx: number, colIdx: number) => ({
      "data-grid-cell": true,
      "data-row": rowIdx,
      "data-col": colIdx,
      onKeyDown: handleCellKeyDown,
    }),
    [handleCellKeyDown],
  )

  const updateCell = useCallback(
    (rowIdx: number, key: string, value: unknown) => {
      const next = data.map((r, i) => (i === rowIdx ? { ...r, [key]: value } : r))
      onDataChange(next)
    },
    [data, onDataChange],
  )

  if (effectiveRowCount <= 0 || columns.length === 0) {
    const msg =
      columns.length === 0
        ? "Table has no columns configured."
        : config.row_source.type === "input"
          ? "Set the linked input value to show rows."
          : "No rows to display."
    return (
      <div className={cn("text-muted-foreground text-sm py-4", className)}>
        {msg}
      </div>
    )
  }

  const renderRowLabel = (rowIdx: number) => {
    if (!row_label_template) return null
    const label = row_label_template.replace(/\{\{n\}\}/g, String(rowIdx + 1))
    return label
  }

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table ref={gridRef} className="w-full border-collapse border text-sm" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr>
            {hasRowLabel && (
              <th className={HEADER_CELL} style={{ width: 50 }}>
                #
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={HEADER_CELL}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
                {col.required && <span className="text-red-600 ml-0.5">*</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: effectiveRowCount }, (_, rowIdx) => {
            const rowData = data[rowIdx] ?? {}

            return (
              <tr key={rowIdx}>
                {hasRowLabel && (
                  <td
                    className={`${CELL} text-center text-muted-foreground`}
                    style={{ width: 50 }}
                  >
                    {renderRowLabel(rowIdx)}
                  </td>
                )}
                {columns.map((col, defIdx) => {
                  const colIdx = (hasRowLabel ? 1 : 0) + defIdx
                  const val = rowData[col.key]

                  return (
                    <td
                      key={col.key}
                      className={CELL}
                      style={col.width ? { width: col.width } : undefined}
                    >
                      <CellRenderer
                        col={col}
                        value={val}
                        onChange={(v) => updateCell(rowIdx, col.key, v)}
                        cellProps={cellProps(rowIdx, colIdx)}
                        onCellKeyDown={handleCellKeyDown}
                        rowIdx={rowIdx}
                        colIdx={colIdx}
                      />
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// --- Cell renderer per column type ---

function CellRenderer({
  col,
  value,
  onChange,
  cellProps,
  onCellKeyDown,
  rowIdx,
  colIdx,
}: {
  col: TableColumnDef
  value: unknown
  onChange: (v: unknown) => void
  cellProps: Record<string, unknown>
  onCellKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void
  rowIdx: number
  colIdx: number
}) {
  const strVal = String(value ?? "")

  switch (col.type) {
    case "currency":
      return (
        <CalcMoneyInput
          value={strVal}
          onValueCommit={onChange}
          placeholder={col.placeholder ?? "$ 0.00"}
          cellProps={{ "data-grid-cell": true, "data-row": rowIdx, "data-col": colIdx }}
          onCellKeyDown={onCellKeyDown}
        />
      )

    case "toggle": {
      const opts = col.options ?? ["Yes", "No"]
      const currentIdx = opts.findIndex((o) => o.toLowerCase() === strVal.toLowerCase())
      const display = currentIdx >= 0 ? opts[currentIdx] : "—"
      return (
        <button
          type="button"
          className={TOGGLE_BTN}
          {...cellProps}
          onClick={() => {
            const nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % opts.length
            onChange(opts[nextIdx])
          }}
        >
          {display}
        </button>
      )
    }

    case "dropdown": {
      const opts = col.options ?? []
      return (
        <select
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className={`${CELL_INPUT} cursor-pointer`}
          data-grid-cell
          data-row={rowIdx}
          data-col={colIdx}
          onKeyDown={onCellKeyDown}
        >
          <option value="">{col.placeholder || "Select..."}</option>
          {opts.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )
    }

    case "number":
      return (
        <input
          type="text"
          inputMode="decimal"
          value={strVal}
          onChange={(e) => {
            const v = e.target.value.replace(/[^\d.\-]/g, "")
            onChange(v)
          }}
          placeholder={col.placeholder ?? ""}
          className={CELL_INPUT}
          data-grid-cell
          data-row={rowIdx}
          data-col={colIdx}
          onKeyDown={onCellKeyDown}
        />
      )

    case "percentage":
      return (
        <div className="h-full relative">
          <input
            type="text"
            inputMode="decimal"
            value={strVal}
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d.\-]/g, "")
              onChange(v)
            }}
            placeholder={col.placeholder ?? "0.00"}
            className={`${CELL_INPUT} pr-6`}
            data-grid-cell
            data-row={rowIdx}
            data-col={colIdx}
            onKeyDown={onCellKeyDown}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">
            %
          </span>
        </div>
      )

    case "readonly":
      return (
        <span className="px-2 text-muted-foreground truncate block leading-9">
          {strVal}
        </span>
      )

    case "text":
    default:
      return (
        <input
          type="text"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={col.placeholder ?? ""}
          className={CELL_INPUT}
          data-grid-cell
          data-row={rowIdx}
          data-col={colIdx}
          onKeyDown={onCellKeyDown}
        />
      )
  }
}
