"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { IconMinus } from "@tabler/icons-react"
import { toast } from "@/hooks/use-toast"

export function DefaultBrokerSettingsDialog() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"programs" | "rates" | "additional">("programs")
  // Aggregated state across tabs
  const [programVisibility, setProgramVisibility] = useState<Record<string, boolean>>({})
  const [rateRows, setRateRows] = useState<
    { id: string; minUpb?: string; maxUpb?: string; origination?: string; adminFee?: string; ysp?: string }[]
  >([])
  const [allowYsp, setAllowYsp] = useState<boolean>(false)
  const [allowBuydown, setAllowBuydown] = useState<boolean>(false)
  const [allowWhiteLabeling, setAllowWhiteLabeling] = useState<boolean>(false)

  const NavItem = ({
    id,
    label,
  }: {
    id: "programs" | "rates" | "additional"
    label: string
  }) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={cn(
        "w-full rounded-md px-2.5 py-1.5 text-left text-sm font-medium",
        tab === id ? "bg-muted" : "hover:bg-muted/60"
      )}
      aria-current={tab === id ? "page" : undefined}
    >
      {label}
    </button>
  )

  return (
    <>
      <Button variant="default" size="sm" type="button" onClick={() => setOpen(true)}>
        Default Broker Settings
      </Button>
      {/* Fetch programs when Programs tab becomes active and dialog is open */}
      {open && tab === "programs" ? <ProgramsLoader /> : null}
      <Dialog open={open} onOpenChange={setOpen}>
        {/* Large modal with split sidebar/content, matching Clerk Organizations vibe */}
        <DialogContent className="sm:max-w-[920px] p-0 overflow-hidden">
          <div className="grid grid-cols-[260px_1fr]">
            {/* Left rail */}
            <aside className="border-r bg-muted/40 p-4">
              <div className="mb-3 px-1">
                <div className="text-lg font-semibold">Default Broker Settings</div>
                <div className="text-xs text-muted-foreground">Manage default broker configuration.</div>
              </div>
              <nav className="space-y-1">
                <div className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  General
                </div>
                <NavItem id="programs" label="Programs" />
                <NavItem id="rates" label="Rates/Fees" />
                <NavItem id="additional" label="Additional" />
              </nav>
            </aside>

            {/* Right content */}
            <section className="bg-background flex flex-col">
              <header className="flex h-12 items-center border-b px-6 text-sm font-semibold">
                {tab === "programs" ? "Programs" : tab === "rates" ? "Rates/Fees" : "Additional"}
              </header>
              <div className="min-h-[440px] p-6">
                {tab === "programs" ? (
                  <ProgramsList
                    value={programVisibility}
                    onChange={(m) => setProgramVisibility(m)}
                  />
                ) : tab === "rates" ? (
                  <RatesFeesTable rows={rateRows} onRowsChange={setRateRows} />
                ) : (
                  <AdditionalSettings
                    allowYsp={allowYsp}
                    allowBuydown={allowBuydown}
                  allowWhiteLabeling={allowWhiteLabeling}
                    onAllowYsp={setAllowYsp}
                    onAllowBuydown={setAllowBuydown}
                  onAllowWhiteLabeling={setAllowWhiteLabeling}
                  />
                )}
              </div>
              {/* bottom action bar */}
              <div className="border-t px-6 py-3 flex justify-end">
                <Button
                  onClick={() => {
                    // Persist via API (upsert by (organization_id, organization_member_id))
                    ;(async () => {
                      try {
                        const body = {
                          allow_ysp: allowYsp,
                          allow_buydown_rate: allowBuydown,
                          program_visibility: programVisibility,
                          rates: rateRows.map((r) => ({
                            min_upb: r.minUpb ?? "",
                            max_upb: r.maxUpb ?? "",
                            origination: r.origination ?? "",
                            admin_fee: r.adminFee ?? "",
                            ysp: r.ysp ?? "",
                          })),
                        }
                        const res = await fetch("/api/brokers/default-settings", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(body),
                        })
                        const j = await res.json().catch(() => ({}))
                        if (!res.ok) throw new Error(j?.error ?? "Failed to save")
                        toast({ title: "Saved", description: "Default broker settings updated." })
                        setOpen(false)
                      } catch (e) {
                        toast({
                          title: "Save failed",
                          description: e instanceof Error ? e.message : "Unknown error",
                          variant: "destructive",
                        })
                      }
                    })()
                  }}
                >
                  Save
                </Button>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function AdditionalSettings({
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

// Lightweight loader to prefetch data
function ProgramsLoader() {
  useEffect(() => {
    void fetch("/api/org/programs").catch(() => undefined)
  }, [])
  return null
}

function ProgramsList({
  value,
  onChange,
}: {
  value: Record<string, boolean>
  onChange: (m: Record<string, boolean>) => void
}) {
  const [items, setItems] = useState<
    { id: string; internal_name: string; external_name: string; loan_type: string }[] | null
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
            loan_type: String(p.loan_type ?? ""),
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
  // Merge in defaults for programs not present in current map (do not overwrite existing)
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
  }, [items, value])
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
          <TableHead className="w-[70%]">Program</TableHead>
          <TableHead className="w-[20%] text-left">Loan Type</TableHead>
          <TableHead className="w-[10%] text-center">Visibility</TableHead>
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
            <TableCell className="uppercase">{p.loan_type}</TableCell>
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

function RatesFeesTable({
  rows,
  onRowsChange,
}: {
  rows: { id: string; minUpb?: string; maxUpb?: string; origination?: string; adminFee?: string; ysp?: string }[]
  onRowsChange: (
    rows: { id: string; minUpb?: string; maxUpb?: string; origination?: string; adminFee?: string; ysp?: string }[]
  ) => void
}) {
  const [editing, setEditing] = useState<boolean>(false)
  const [snapshot, setSnapshot] = useState<typeof rows | null>(null)

  const addRow = () => {
    onRowsChange([
      ...rows,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, minUpb: "", maxUpb: "", origination: "", adminFee: "", ysp: "" },
    ])
  }

  const sanitize = (s: string): string => s.replace(/[^0-9.]/g, "")
  const stripCommas = (s: string): string => s.replace(/,/g, "")
  const fmtMoney = (s: string): string => {
    const n = Number(stripCommas(s))
    if (!Number.isFinite(n)) return s ?? ""
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
  }
  const fmtMoneyDollar = (s: string): string => `$${fmtMoney(s)}`
  const fmtMoneyDollarInput = (s: string): string => {
    const v = (s ?? "").toString().trim()
    if (v === "") return ""
    return `$${fmtMoney(v)}`
  }
  const normalizeMoneyRaw = (s: string): string => {
    let raw = s.replace(/[^\d.]/g, "")
    const firstDot = raw.indexOf(".")
    if (firstDot !== -1) {
      const left = raw.slice(0, firstDot)
      const right = raw.slice(firstDot + 1).replace(/\./g, "")
      raw = `${left}.${right.slice(0, 2)}`
    } else {
      raw = raw.replace(/\./g, "")
    }
    return raw
  }
  const formatCurrency = (raw: string): string => {
    if (!raw) return ""
    const [i = "", d = ""] = String(raw).split(".")
    const int = i.replace(/^0+(?=\d)/, "") || "0"
    const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    const dec = (d ?? "").padEnd(2, "0").slice(0, 2)
    return `$${withCommas}.${dec}`
  }
  const countDigitsBefore = (s: string, pos: number): number => s.slice(0, pos).replace(/[^0-9]/g, "").length
  const caretFromDigits = (formatted: string, digitsBefore: number): number => {
    let seen = 0
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        seen++
        if (seen >= digitsBefore) return i + 1
      }
    }
    return formatted.length
  }
  const handleMoneyChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number,
    key: "minUpb" | "maxUpb" | "adminFee"
  ) => {
    const el = e.target
    const selection = el.selectionStart ?? el.value.length
    const digitsBefore = countDigitsBefore(el.value, selection)
    const nextRaw = normalizeMoneyRaw(el.value)
    onRowsChange(rows.map((r, rIdx) => (rIdx === idx ? { ...r, [key]: nextRaw } : r)))
    requestAnimationFrame(() => {
      try {
        const display = formatCurrency(nextRaw)
        const newPos = caretFromDigits(display, digitsBefore)
        el.setSelectionRange(newPos, newPos)
      } catch {
        // ignore caret errors
      }
    })
  }
  const fmtPercent = (s: string): string => {
    const n = Number(stripCommas(s))
    if (!Number.isFinite(n)) return s ?? ""
    return n.toFixed(2)
  }
  const clampPercentStr = (s: string): string => {
    let raw = s.replace(/[^\d.]/g, "")
    if (raw.length === 0) return ""
    const firstDot = raw.indexOf(".")
    if (firstDot !== -1) {
      const left = raw.slice(0, firstDot)
      const right = raw.slice(firstDot + 1).replace(/\./g, "")
      raw = `${left}.${right}`
    }
    let hadDot = raw.includes(".")
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
    decPart = decPart.slice(0, 2)
    if (hadDot) {
      return `${intPart}.${decPart}`
    }
    return `${intPart}`
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2">
        {!editing ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
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
                setSnapshot(null)
                setEditing(false)
              }}
            >
              Done
            </Button>
          </>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[20%] text-center">
              <div className="leading-tight">
                <div>Min. UPB</div>
                <div>($)</div>
              </div>
            </TableHead>
            <TableHead className="w-[20%] text-center">
              <div className="leading-tight">
                <div>Max. UPB</div>
                <div>($)</div>
              </div>
            </TableHead>
            <TableHead className="w-[20%] text-center">
              <div className="leading-tight">
                <div>Origination</div>
                <div>(%)</div>
              </div>
            </TableHead>
            <TableHead className="w-[20%] text-center">
              <div className="leading-tight">
                <div>Admin Fee</div>
                <div>($)</div>
              </div>
            </TableHead>
            <TableHead className="w-[20%] text-center">
              <div className="leading-tight">
                <div>YSP</div>
                <div>(%)</div>
              </div>
            </TableHead>
            {editing ? <TableHead className="w-[48px]" /> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && !editing ? (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground">
                No rates/fees configured.
              </TableCell>
            </TableRow>
          ) : null}
          {rows.map((row, idx) => (
            <TableRow key={row.id}>
              <TableCell className="text-center">
                {editing ? (
                  <Input
                    value={formatCurrency(row.minUpb ?? "")}
                    onChange={(e) => handleMoneyChange(e, idx, "minUpb")}
                    placeholder="$0.00"
                    className="h-8 text-sm text-center px-2"
                  />
                ) : (
                  <span>{fmtMoneyDollar(row.minUpb ?? "")}</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {editing ? (
                  <Input
                    value={formatCurrency(row.maxUpb ?? "")}
                    onChange={(e) => handleMoneyChange(e, idx, "maxUpb")}
                    placeholder="$0.00"
                    className="h-8 text-sm text-center px-2"
                  />
                ) : (
                  <span>{fmtMoneyDollar(row.maxUpb ?? "")}</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {editing ? (
                  <Input
                    value={row.origination ?? ""}
                    onChange={(e) =>
                      onRowsChange(
                        rows.map((r, rIdx) => (rIdx === idx ? { ...r, origination: clampPercentStr(e.target.value) } : r))
                      )
                    }
                    placeholder="0.00"
                    className="h-8 text-sm text-center px-2"
                  />
                ) : (
                  <span>{fmtPercent(row.origination ?? "")}</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {editing ? (
                  <Input
                    value={formatCurrency(row.adminFee ?? "")}
                    onChange={(e) => handleMoneyChange(e, idx, "adminFee")}
                    placeholder="$0.00"
                    className="h-8 text-sm text-center px-2"
                  />
                ) : (
                  <span>{fmtMoneyDollar(row.adminFee ?? "")}</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {editing ? (
                  <Input
                    value={row.ysp ?? ""}
                    onChange={(e) =>
                      onRowsChange(rows.map((r, rIdx) => (rIdx === idx ? { ...r, ysp: clampPercentStr(e.target.value) } : r)))
                    }
                    placeholder="0.00"
                    className="h-8 text-sm text-center px-2"
                  />
                ) : (
                  <span>{fmtPercent(row.ysp ?? "")}</span>
                )}
              </TableCell>
              {editing ? (
                <TableCell className="text-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onRowsChange(rows.filter((_, rIdx) => rIdx !== idx))}
                    aria-label="Remove row"
                  >
                    <IconMinus className="h-4 w-4" />
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
          {editing ? (
            <TableRow>
              <TableCell colSpan={6}>
                <Button variant="ghost" size="sm" onClick={addRow}>
                  + Add Row
                </Button>
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  )
}


