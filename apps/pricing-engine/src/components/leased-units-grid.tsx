"use client"

import * as React from "react"
import { useCallback, useRef, useState } from "react"
import { cn } from "@repo/lib/cn"

export interface UnitRow {
  id: string
  unitNumber: string
  leased: "yes" | "no" | undefined
  gross: string
  market: string
}

// --- Currency formatting helpers (same as broker-settings-shared) ---

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

// --- Style constants ---

const CELL = "h-9 border-r border-b text-sm last:border-r-0"
const CELL_INPUT =
  "h-full w-full border-0 bg-transparent text-sm outline-none ring-0 focus:bg-accent/40 focus:ring-2 focus:ring-ring focus:z-10 focus:relative px-2"
const HEADER_CELL =
  "h-9 border-r border-b bg-muted/60 text-center text-[11px] font-semibold text-muted-foreground last:border-r-0 select-none"
const TOGGLE_BTN =
  "h-full w-full border-0 bg-transparent text-center text-sm font-medium outline-none ring-0 focus:bg-accent/40 focus:ring-2 focus:ring-ring cursor-pointer select-none hover:bg-muted/60 transition-colors"

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
    [calcMode, onValueCommit]
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
    [calcMode, resolveExpression, onCellKeyDown]
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

// Navigable columns: 1 (leased), 2 (gross), 3 (market). Col 0 is read-only #.
const MIN_COL = 1
const MAX_COL = 3

interface LeasedUnitsGridProps {
  data: UnitRow[]
  onDataChange: React.Dispatch<React.SetStateAction<UnitRow[]>>
  className?: string
}

export function LeasedUnitsGrid({ data, onDataChange, className }: LeasedUnitsGridProps) {
  const gridRef = useRef<HTMLTableElement>(null)

  const focusCell = useCallback((rowIdx: number, colIdx: number) => {
    if (!gridRef.current) return
    const cells = gridRef.current.querySelectorAll<HTMLElement>("tbody [data-grid-cell]")
    const target = Array.from(cells).find(
      (el) => el.dataset.row === String(rowIdx) && el.dataset.col === String(colIdx)
    )
    if (target) {
      target.focus()
      if (target instanceof HTMLInputElement) target.select()
    }
  }, [])

  const toggleLeased = useCallback(
    (idx: number) => {
      onDataChange((prev) =>
        prev.map((r, i) => {
          if (i !== idx) return r
          const next = r.leased === "yes" ? "no" : "yes"
          return { ...r, leased: next }
        })
      )
    },
    [onDataChange]
  )

  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      const el = e.currentTarget as HTMLElement
      const row = Number(el.dataset.row ?? 0)
      const col = Number(el.dataset.col ?? 0)
      const maxRow = data.length - 1
      const isInput = el instanceof HTMLInputElement
      const isButton = el instanceof HTMLButtonElement

      switch (e.key) {
        case "Tab": {
          e.preventDefault()
          if (e.shiftKey) {
            if (col > MIN_COL) focusCell(row, col - 1)
            else if (row > 0) focusCell(row - 1, MAX_COL)
          } else {
            if (col < MAX_COL) focusCell(row, col + 1)
            else if (row < maxRow) focusCell(row + 1, MIN_COL)
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
            if (col > MIN_COL) focusCell(row, col - 1)
          } else if (isInput) {
            const atStart = el.selectionStart === 0 && el.selectionEnd === 0
            if (atStart && col > MIN_COL) {
              e.preventDefault()
              focusCell(row, col - 1)
            }
          }
          break
        }
        case "ArrowRight": {
          if (isButton) {
            e.preventDefault()
            if (col < MAX_COL) focusCell(row, col + 1)
          } else if (isInput) {
            const atEnd = el.selectionStart === el.value.length
            if (atEnd && col < MAX_COL) {
              e.preventDefault()
              focusCell(row, col + 1)
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
    [data.length, focusCell]
  )

  const cellProps = useCallback(
    (rowIdx: number, colIdx: number) => ({
      "data-grid-cell": true,
      "data-row": rowIdx,
      "data-col": colIdx,
      onKeyDown: handleCellKeyDown,
    }),
    [handleCellKeyDown]
  )

  if (data.length === 0) {
    return (
      <div className={cn("text-muted-foreground text-sm py-4", className)}>
        Select Property Type and Number of Units to add unit rows.
      </div>
    )
  }

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table
        ref={gridRef}
        className="w-full border-collapse border text-sm"
      >
        <thead>
          <tr>
            <th className={HEADER_CELL} style={{ width: 50 }}>#</th>
            <th className={HEADER_CELL} style={{ width: 100 }}>
              Leased <span className="text-red-600">*</span>
            </th>
            <th className={HEADER_CELL}>
              Gross Rent <span className="text-red-600">*</span>
            </th>
            <th className={HEADER_CELL}>
              Market Rent <span className="text-red-600">*</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.id}>
              {/* Col 0: Row number (read-only) */}
              <td className={`${CELL} text-center text-muted-foreground`} style={{ width: 50 }}>
                {row.unitNumber}
              </td>

              {/* Col 1: Leased toggle */}
              <td className={CELL} style={{ width: 100 }}>
                <button
                  type="button"
                  className={TOGGLE_BTN}
                  {...cellProps(idx, 1)}
                  onClick={() => toggleLeased(idx)}
                >
                  {row.leased === "yes" ? "Yes" : row.leased === "no" ? "No" : "—"}
                </button>
              </td>

              {/* Col 2: Gross Rent */}
              <td className={CELL}>
                <CalcMoneyInput
                  value={row.gross ?? ""}
                  onValueCommit={(v) =>
                    onDataChange((prev) => prev.map((r, i) => (i === idx ? { ...r, gross: v } : r)))
                  }
                  placeholder="$ 0.00"
                  cellProps={{ "data-grid-cell": true, "data-row": idx, "data-col": 2 }}
                  onCellKeyDown={handleCellKeyDown}
                />
              </td>

              {/* Col 3: Market Rent */}
              <td className={CELL}>
                <CalcMoneyInput
                  value={row.market ?? ""}
                  onValueCommit={(v) =>
                    onDataChange((prev) => prev.map((r, i) => (i === idx ? { ...r, market: v } : r)))
                  }
                  placeholder="$ 0.00"
                  cellProps={{ "data-grid-cell": true, "data-row": idx, "data-col": 3 }}
                  onCellKeyDown={handleCellKeyDown}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
