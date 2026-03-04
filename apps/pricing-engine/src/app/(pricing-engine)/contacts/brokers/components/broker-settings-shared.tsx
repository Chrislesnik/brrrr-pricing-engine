"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@repo/ui/shadcn/button"
import { Switch } from "@repo/ui/shadcn/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table"
import { IconMinus, IconAlertTriangle } from "@tabler/icons-react"
import { toast } from "@/hooks/use-toast"

export type RateRow = {
  id: string
  minUpb?: string
  minOp?: string
  maxOp?: string
  maxUpb?: string
  origination?: string
  adminFee?: string
  ysp?: string
}

export function AdditionalSettings({
  allowYsp,
  allowBuydown,
  allowWhiteLabeling,
  onAllowYsp,
  onAllowBuydown,
  onAllowWhiteLabeling,
}: {
  allowYsp: boolean
  allowBuydown: boolean
  allowWhiteLabeling: boolean
  onAllowYsp: (v: boolean) => void
  onAllowBuydown: (v: boolean) => void
  onAllowWhiteLabeling: (v: boolean) => void
}) {
  return (
    <div className="max-w-xl space-y-3">
      <div className="flex items-center justify-between py-1">
        <div className="text-sm font-medium">Allow broker to add YSP</div>
        <Switch checked={allowYsp} onCheckedChange={onAllowYsp} aria-label="Allow broker to add YSP" />
      </div>
      <div className="flex items-center justify-between py-1">
        <div className="text-sm font-medium">Allow brokers to buydown rate</div>
        <Switch checked={allowBuydown} onCheckedChange={onAllowBuydown} aria-label="Allow brokers to buydown rate" />
      </div>
      <div className="flex items-center justify-between py-1">
        <div className="text-sm font-medium">Allow white labeling</div>
        <Switch checked={allowWhiteLabeling} onCheckedChange={onAllowWhiteLabeling} aria-label="Allow white labeling" />
      </div>
    </div>
  )
}

export function ProgramsLoader() {
  useEffect(() => {
    void fetch("/api/org/programs").catch(() => undefined)
  }, [])
  return null
}

export function ProgramsList({
  value,
  onChange,
}: {
  value: Record<string, boolean>
  onChange: (m: Record<string, boolean>) => void
}) {
  const [items, setItems] = useState<
    { id: string; internal_name: string; external_name: string }[] | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const visibilityMap = value
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/org/programs", { cache: "no-store" })
        const json = (await res.json()) as { items?: unknown[]; error?: string }
        if (cancelled) return
        if (json?.error) {
          setError(json.error)
          setItems([])
          return
        }
        const arr = Array.isArray(json?.items) ? json.items : []
        const mapped = arr
          .map((p) => p as Record<string, unknown>)
          .map((p) => ({
            id: String(p.id ?? ""),
            internal_name: String(p.internal_name ?? ""),
            external_name: String(p.external_name ?? ""),
          }))
        setItems(mapped)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load programs")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!items) return
    const next = { ...value }
    let changed = false
    items.forEach((p) => {
      if (next[p.id] === undefined) {
        next[p.id] = false
        changed = true
      }
    })
    if (changed) onChange(next)
  }, [items, value, onChange])

  if (!items && !error) {
    return <div className="text-sm text-muted-foreground">Loading programs…</div>
  }
  if (error) {
    return <div className="text-sm text-destructive">Failed to load programs: {error}</div>
  }
  if (!items?.length) {
    return <div className="text-sm text-muted-foreground">No active programs.</div>
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80%]">Program</TableHead>
          <TableHead className="w-[20%] text-center">Visibility</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((p) => (
          <TableRow key={p.id}>
            <TableCell>
              <div className="min-w-0">
                <div className="truncate font-semibold">{p.internal_name}</div>
                <div className="truncate text-muted-foreground text-xs">{p.external_name}</div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex justify-center">
                <Switch
                  checked={!!visibilityMap[p.id]}
                  onCheckedChange={(v) => onChange({ ...visibilityMap, [p.id]: v })}
                  aria-label={`Toggle visibility for ${p.internal_name}`}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// --- Currency / percent formatting helpers ---

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

function displayMoney(raw: string): string {
  if (!raw) return ""
  const n = Number(raw)
  if (!Number.isFinite(n)) return raw
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n)
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

function clampPercentStr(s: string): string {
  let raw = s.replace(/[^\d.]/g, "")
  if (raw.length === 0) return ""
  const firstDot = raw.indexOf(".")
  if (firstDot !== -1) {
    const left = raw.slice(0, firstDot)
    const right = raw.slice(firstDot + 1).replace(/\./g, "")
    raw = `${left}.${right}`
  }
  const hadDot = raw.includes(".")
  let [intPart, decPart = ""] = raw.split(".")
  if (intPart === "") intPart = "0"
  intPart = intPart.replace(/^0+(?=\d)/, "")
  if (intPart === "") intPart = "0"
  const intNum = Number(intPart)
  if (!Number.isFinite(intNum)) return ""
  if (intNum > 100) {
    return "100"
  }
  if (intNum === 100) {
    return "100"
  }
  decPart = decPart.slice(0, 4)
  if (hadDot) {
    return `${intPart}.${decPart}`
  }
  return `${intPart}`
}

function fmtPercent(s: string): string {
  const v = String(s ?? "").trim()
  if (v === "") return ""
  const cleaned = v.replace(/[^\d.]/g, "")
  const [i = "", d = ""] = cleaned.split(".")
  const int = (i || "0").replace(/^0+(?=\d)/, "") || "0"
  const dec = (d ?? "").slice(0, 4)
  return dec.length ? `${int}.${dec}` : int
}

const DATA_COLS = 7
const OP_CELL = "h-8 border-r border-b text-center text-xs last:border-r-0"
const OP_BTN = "h-full w-full border-0 bg-transparent text-center text-xs font-semibold outline-none ring-0 focus:bg-accent/40 focus:ring-2 focus:ring-ring cursor-pointer select-none hover:bg-muted/60 transition-colors"
const CELL_ERROR = "bg-red-50 dark:bg-red-950/30"
const CELL = "h-8 border-r border-b text-center text-sm last:border-r-0"
const CELL_INPUT = "h-full w-full border-0 bg-transparent text-center text-sm outline-none ring-0 focus:bg-accent/40 focus:ring-2 focus:ring-ring focus:z-10 focus:relative px-2"
const HEADER_CELL = "h-9 border-r border-b bg-muted/60 text-center text-[11px] font-semibold text-muted-foreground last:border-r-0 select-none"

function makeEmptyRow(): RateRow {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, minUpb: "", minOp: ">=", maxOp: "<=", maxUpb: "", origination: "", adminFee: "", ysp: "" }
}

export function isRateRowEmpty(r: RateRow): boolean {
  return !(r.minUpb ?? "").trim()
    && !(r.maxUpb ?? "").trim()
    && !(r.origination ?? "").trim()
    && !(r.adminFee ?? "").trim()
    && !(r.ysp ?? "").trim()
}

export function stripEmptyRateRows(rows: RateRow[]): RateRow[] {
  return rows.filter((r) => !isRateRowEmpty(r))
}

export function RatesFeesTable({
  rows,
  onRowsChange,
}: {
  rows: RateRow[]
  onRowsChange: (rows: RateRow[]) => void
}) {
  const [editing, setEditing] = useState<boolean>(false)
  const [snapshot, setSnapshot] = useState<RateRow[] | null>(null)
  const gridRef = useRef<HTMLTableElement>(null)
  const pendingFocusRef = useRef<{ row: number; col: number } | null>(null)

  const ensureMinRow = useCallback(
    (r: RateRow[]) => (r.length === 0 ? [makeEmptyRow()] : r),
    []
  )

  const appendRowAndFocus = useCallback(
    (col: number) => {
      if (rows.length >= 50) return
      const next = [...rows, makeEmptyRow()]
      onRowsChange(next)
      pendingFocusRef.current = { row: next.length - 1, col }
    },
    [rows, onRowsChange]
  )

  useEffect(() => {
    if (!pendingFocusRef.current || !gridRef.current) return
    const { row, col } = pendingFocusRef.current
    pendingFocusRef.current = null
    requestAnimationFrame(() => {
      if (!gridRef.current) return
      const cells = gridRef.current.querySelectorAll<HTMLElement>("tbody [data-grid-cell]")
      const target = Array.from(cells).find(
        (el) => el.dataset.row === String(row) && el.dataset.col === String(col)
      )
      if (target) {
        target.focus()
        if (target instanceof HTMLInputElement) target.select()
      }
    })
  })

  const handleMoneyChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number,
    key: "minUpb" | "maxUpb" | "adminFee"
  ) => {
    const el = e.target
    const pos = el.selectionStart ?? el.value.length
    const sigBefore = significantCharsBefore(el.value, pos)
    const nextRaw = normalizeMoneyRaw(el.value)
    onRowsChange(rows.map((r, rIdx) => (rIdx === idx ? { ...r, [key]: nextRaw } : r)))
    const formatted = formatMoneyLive(nextRaw)
    requestAnimationFrame(() => {
      try {
        const newPos = caretFromSignificantChars(formatted, sigBefore)
        el.setSelectionRange(newPos, newPos)
      } catch { /* ignore */ }
    })
  }

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

  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      const el = e.currentTarget as HTMLElement
      const row = Number(el.dataset.row ?? 0)
      const col = Number(el.dataset.col ?? 0)
      const maxRow = rows.length - 1
      const maxCol = DATA_COLS - 1
      const isLastRow = row === maxRow
      const isInput = el instanceof HTMLInputElement
      const isButton = el instanceof HTMLButtonElement

      switch (e.key) {
        case "Tab": {
          e.preventDefault()
          if (e.shiftKey) {
            if (col > 0) focusCell(row, col - 1)
            else if (row > 0) focusCell(row - 1, maxCol)
          } else {
            if (col < maxCol) focusCell(row, col + 1)
            else if (isLastRow) appendRowAndFocus(0)
            else focusCell(row + 1, 0)
          }
          break
        }
        case "Enter": {
          if (isButton) break
          e.preventDefault()
          if (e.shiftKey) {
            if (row > 0) focusCell(row - 1, col)
          } else {
            if (isLastRow) appendRowAndFocus(col)
            else focusCell(row + 1, col)
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
          if (isLastRow) appendRowAndFocus(col)
          else focusCell(row + 1, col)
          break
        }
        case "ArrowLeft": {
          if (isButton) {
            e.preventDefault()
            if (col > 0) focusCell(row, col - 1)
          } else if (isInput) {
            const atStart = el.selectionStart === 0 && el.selectionEnd === 0
            if (atStart && col > 0) {
              e.preventDefault()
              focusCell(row, col - 1)
            }
          }
          break
        }
        case "ArrowRight": {
          if (isButton) {
            e.preventDefault()
            if (col < maxCol) focusCell(row, col + 1)
          } else if (isInput) {
            const atEnd = el.selectionStart === el.value.length
            if (atEnd && col < maxCol) {
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
    [rows.length, focusCell, appendRowAndFocus]
  )

  const cellProps = (rowIdx: number, colIdx: number) => ({
    "data-grid-cell": true,
    "data-row": rowIdx,
    "data-col": colIdx,
    onKeyDown: handleCellKeyDown,
  })

  const displayRows = editing ? ensureMinRow(rows) : stripEmptyRateRows(rows)
  const colCount = editing ? 8 : 7

  // Error keys: "row:col" where col 0 = minUpb, 1 = minOp, 2 = maxOp, 3 = maxUpb
  const errorCells = useMemo(() => {
    const errors = new Set<string>()
    const EPS = 0.001

    type ParsedRow = { minVal: number; maxVal: number; lo: number; hi: number } | null
    const parsed: ParsedRow[] = displayRows.map((r) => {
      const minVal = Number(r.minUpb ?? "")
      const maxVal = Number(r.maxUpb ?? "")
      if (!Number.isFinite(minVal) || !Number.isFinite(maxVal)) return null
      if (!(r.minUpb ?? "").trim() || !(r.maxUpb ?? "").trim()) return null
      const lo = (r.minOp ?? ">=") === ">" ? minVal + EPS : minVal
      const hi = (r.maxOp ?? "<=") === "<" ? maxVal - EPS : maxVal
      return { minVal, maxVal, lo, hi }
    })

    // Within-row: min > max (inverted range)
    for (let i = 0; i < displayRows.length; i++) {
      const p = parsed[i]
      if (!p) continue
      if (p.lo > p.hi) {
        errors.add(`${i}:0`)
        errors.add(`${i}:1`)
        errors.add(`${i}:2`)
        errors.add(`${i}:3`)
      }
    }

    // Between rows: highlight only the boundary where two ranges meet
    for (let i = 0; i < displayRows.length; i++) {
      const a = parsed[i]
      if (!a || a.lo > a.hi) continue
      for (let j = i + 1; j < displayRows.length; j++) {
        const b = parsed[j]
        if (!b || b.lo > b.hi) continue
        if (a.lo <= b.hi && b.lo <= a.hi) {
          // Determine which boundary is the contact point
          const aMaxMeetsBMin = a.maxVal >= b.minVal
          const bMaxMeetsAMin = b.maxVal >= a.minVal

          if (aMaxMeetsBMin && (!bMaxMeetsAMin || a.maxVal - b.minVal < b.maxVal - a.minVal || a.maxVal === b.minVal)) {
            // a's max touches b's min
            errors.add(`${i}:2`)
            errors.add(`${i}:3`)
            errors.add(`${j}:0`)
            errors.add(`${j}:1`)
          } else if (bMaxMeetsAMin) {
            // b's max touches a's min
            errors.add(`${j}:2`)
            errors.add(`${j}:3`)
            errors.add(`${i}:0`)
            errors.add(`${i}:1`)
          }
        }
      }
    }

    return errors
  }, [displayRows])

  const gapWarnings = useMemo(() => {
    const warnings: string[] = []
    const nonEmpty = displayRows.filter((r) =>
      (r.minUpb ?? "").trim() && (r.maxUpb ?? "").trim()
    )
    if (nonEmpty.length === 0) return warnings

    type Range = { lo: number; hi: number; loStrict: boolean; hiStrict: boolean; loVal: number; hiVal: number }
    const ranges: Range[] = nonEmpty
      .map((r) => {
        const minVal = Number(r.minUpb ?? "")
        const maxVal = Number(r.maxUpb ?? "")
        if (!Number.isFinite(minVal) || !Number.isFinite(maxVal)) return null
        if (minVal > maxVal) return null
        return {
          lo: minVal,
          hi: maxVal,
          loStrict: (r.minOp ?? ">=") === ">",
          hiStrict: (r.maxOp ?? "<=") === "<",
          loVal: minVal,
          hiVal: maxVal,
        }
      })
      .filter((r): r is Range => r !== null)
      .sort((a, b) => a.lo - b.lo || a.hi - b.hi)

    if (ranges.length === 0) return warnings

    const fmtVal = (n: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

    const lowestMin = ranges[0].lo
    if (lowestMin > 0) {
      const upper = ranges[0].loStrict ? fmtVal(lowestMin) : fmtVal(lowestMin - 1)
      warnings.push(`Loan amounts from $1 to ${upper} are not covered.`)
    } else if (lowestMin === 0 && ranges[0].loStrict) {
      warnings.push("Loan amounts equal to $0 are excluded (using > instead of >=).")
    }

    let coveredHi = ranges[0].hi
    let coveredHiStrict = ranges[0].hiStrict
    for (let i = 1; i < ranges.length; i++) {
      const r = ranges[i]
      const gapStart = coveredHi
      const gapEnd = r.lo
      const hasGap =
        gapStart < gapEnd ||
        (gapStart === gapEnd && coveredHiStrict && r.loStrict)

      if (hasGap) {
        const from = coveredHiStrict ? fmtVal(gapStart) : fmtVal(gapStart + 1)
        const to = r.loStrict ? fmtVal(gapEnd) : fmtVal(gapEnd - 1)
        if (from === to) {
          warnings.push(`Loan amount ${from} is not covered.`)
        } else {
          warnings.push(`Loan amounts from ${from} to ${to} are not covered.`)
        }
      }

      if (r.hi > coveredHi || (r.hi === coveredHi && !r.hiStrict && coveredHiStrict)) {
        coveredHi = r.hi
        coveredHiStrict = r.hiStrict
      }
    }

    return warnings
  }, [displayRows])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2">
        {!editing ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const withMin = ensureMinRow(rows)
              if (withMin !== rows) onRowsChange(withMin)
              setSnapshot(rows.map((r) => ({ ...r })))
              setEditing(true)
            }}
          >
            Edit
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (snapshot) onRowsChange(snapshot.map((r) => ({ ...r })))
                setEditing(false)
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onRowsChange(stripEmptyRateRows(rows))
                setSnapshot(null)
                setEditing(false)
              }}
            >
              Done
            </Button>
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-md border">
        <table ref={gridRef} className="w-full border-collapse">
          <colgroup>
            <col style={{ width: "18%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "16%" }} />
            {editing && <col style={{ width: "36px" }} />}
          </colgroup>
          <thead>
            <tr>
              <th className={HEADER_CELL}>Min. UPB ($)</th>
              <th className={HEADER_CELL}>Op</th>
              <th className={HEADER_CELL}>Op</th>
              <th className={HEADER_CELL}>Max. UPB ($)</th>
              <th className={HEADER_CELL}>Origination (%)</th>
              <th className={HEADER_CELL}>Admin Fee ($)</th>
              <th className={HEADER_CELL}>YSP (%)</th>
              {editing && <th className={HEADER_CELL} />}
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="h-10 text-center text-sm text-muted-foreground">
                  No rates/fees configured.
                </td>
              </tr>
            ) : null}
            {displayRows.map((row, idx) => (
              <tr key={row.id} className="group">
                <td className={`${CELL} ${errorCells.has(`${idx}:0`) ? CELL_ERROR : ""}`}>
                  {editing ? (
                    <input
                      value={formatMoneyLive(row.minUpb ?? "")}
                      onChange={(e) => handleMoneyChange(e as any, idx, "minUpb")}
                      placeholder="$0"
                      className={CELL_INPUT}
                      {...cellProps(idx, 0)}
                    />
                  ) : (
                    <span className="inline-block px-2">{displayMoney(row.minUpb ?? "")}</span>
                  )}
                </td>
                <td className={`${OP_CELL} ${errorCells.has(`${idx}:1`) ? CELL_ERROR : ""}`}>
                  {editing ? (
                    <button
                      type="button"
                      className={OP_BTN}
                      data-grid-cell data-row={idx} data-col={1}
                      onKeyDown={handleCellKeyDown}
                      onClick={() => {
                        const next = (row.minOp ?? ">=") === ">=" ? ">" : ">="
                        onRowsChange(rows.map((r, rIdx) => (rIdx === idx ? { ...r, minOp: next } : r)))
                      }}
                    >
                      {row.minOp || ">="}
                    </button>
                  ) : (
                    <span className="text-muted-foreground">{row.minOp || ">="}</span>
                  )}
                </td>
                <td className={`${OP_CELL} ${errorCells.has(`${idx}:2`) ? CELL_ERROR : ""}`}>
                  {editing ? (
                    <button
                      type="button"
                      className={OP_BTN}
                      data-grid-cell data-row={idx} data-col={2}
                      onKeyDown={handleCellKeyDown}
                      onClick={() => {
                        const next = (row.maxOp ?? "<=") === "<=" ? "<" : "<="
                        onRowsChange(rows.map((r, rIdx) => (rIdx === idx ? { ...r, maxOp: next } : r)))
                      }}
                    >
                      {row.maxOp || "<="}
                    </button>
                  ) : (
                    <span className="text-muted-foreground">{row.maxOp || "<="}</span>
                  )}
                </td>
                <td className={`${CELL} ${errorCells.has(`${idx}:3`) ? CELL_ERROR : ""}`}>
                  {editing ? (
                    <input
                      value={formatMoneyLive(row.maxUpb ?? "")}
                      onChange={(e) => handleMoneyChange(e as any, idx, "maxUpb")}
                      placeholder="$0"
                      className={CELL_INPUT}
                      {...cellProps(idx, 3)}
                    />
                  ) : (
                    <span className="inline-block px-2">{displayMoney(row.maxUpb ?? "")}</span>
                  )}
                </td>
                <td className={CELL}>
                  {editing ? (
                    <input
                      value={row.origination ?? ""}
                      onChange={(e) =>
                        onRowsChange(
                          rows.map((r, rIdx) => (rIdx === idx ? { ...r, origination: clampPercentStr(e.target.value) } : r))
                        )
                      }
                      placeholder="0.00"
                      className={CELL_INPUT}
                      {...cellProps(idx, 4)}
                    />
                  ) : (
                    <span className="inline-block px-2">{fmtPercent(row.origination ?? "")}</span>
                  )}
                </td>
                <td className={CELL}>
                  {editing ? (
                    <input
                      value={formatMoneyLive(row.adminFee ?? "")}
                      onChange={(e) => handleMoneyChange(e as any, idx, "adminFee")}
                      placeholder="$0"
                      className={CELL_INPUT}
                      {...cellProps(idx, 5)}
                    />
                  ) : (
                    <span className="inline-block px-2">{displayMoney(row.adminFee ?? "")}</span>
                  )}
                </td>
                <td className={CELL}>
                  {editing ? (
                    <input
                      value={row.ysp ?? ""}
                      onChange={(e) =>
                        onRowsChange(rows.map((r, rIdx) => (rIdx === idx ? { ...r, ysp: clampPercentStr(e.target.value) } : r)))
                      }
                      placeholder="0.00"
                      className={CELL_INPUT}
                      {...cellProps(idx, 6)}
                    />
                  ) : (
                    <span className="inline-block px-2">{fmtPercent(row.ysp ?? "")}</span>
                  )}
                </td>
                {editing && (
                  <td className="h-8 border-b text-center">
                    <button
                      type="button"
                      onClick={() => {
                        const next = rows.filter((_, rIdx) => rIdx !== idx)
                        onRowsChange(next.length === 0 ? [makeEmptyRow()] : next)
                      }}
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
                      aria-label="Remove row"
                    >
                      <IconMinus className="h-3.5 w-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {editing && (
          <div className="flex items-center gap-3 border-t bg-muted/30 px-3 py-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => appendRowAndFocus(0)}
              disabled={rows.length >= 50}
            >
              + Add Row
            </Button>
            {rows.length >= 50 && (
              <span className="text-xs text-muted-foreground">Maximum of 50 rows allowed.</span>
            )}
          </div>
        )}
      </div>

      {gapWarnings.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-3 py-2 space-y-1">
          {gapWarnings.map((msg, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
              <IconAlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
