"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { IconMinus } from "@tabler/icons-react"
import { toast } from "@/hooks/use-toast"

export function BrokerSettingsDialog({
  brokerId,
  open,
  onOpenChange,
  onSaved,
}: {
  brokerId: string
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved?: () => void
}) {
  const [tab, setTab] = useState<"programs" | "rates" | "additional">("programs")
  const [programVisibility, setProgramVisibility] = useState<Record<string, boolean>>({})
  const [rateRows, setRateRows] = useState<
    { id: string; minUpb?: string; maxUpb?: string; origination?: string; adminFee?: string; ysp?: string }[]
  >([])
  const [allowYsp, setAllowYsp] = useState<boolean>(false)
  const [allowBuydown, setAllowBuydown] = useState<boolean>(false)
 

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/brokers/${brokerId}/custom-settings`, { cache: "no-store" })
        const j = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(j?.error ?? "Failed to load")
        if (cancelled) return
        setAllowYsp(j.allow_ysp === true)
        setAllowBuydown(j.allow_buydown_rate === true)
        setProgramVisibility((j.program_visibility as Record<string, boolean>) ?? {})
        setRateRows(
          Array.isArray(j.rates)
            ? j.rates.map((r: any) => ({
                id: String(r.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
                minUpb: r.min_upb ?? "",
                maxUpb: r.max_upb ?? "",
                origination: r.origination ?? "",
                adminFee: r.admin_fee ?? "",
                ysp: r.ysp ?? "",
              }))
            : []
        )
      } catch (e) {
        toast({
          title: "Load failed",
          description: e instanceof Error ? e.message : "Unknown error",
          variant: "destructive",
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, brokerId])

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
      className={cn("w-full rounded-md px-2.5 py-1.5 text-left text-sm font-medium", tab === id ? "bg-muted" : "hover:bg-muted/60")}
      aria-current={tab === id ? "page" : undefined}
    >
      {label}
    </button>
  )

  return (
    <>
      {/* Preload programs when Programs tab becomes active and dialog is open */}
      {open && tab === "programs" ? <ProgramsLoader /> : null}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[920px] p-0 overflow-hidden">
          <div className="grid grid-cols-[260px_1fr]">
            <aside className="border-r bg-muted/40 p-4">
              <div className="mb-3 px-1">
                <div className="text-lg font-semibold">Broker Settings</div>
                <div className="text-xs text-muted-foreground">Manage settings for this broker.</div>
              </div>
              <nav className="space-y-1">
                <div className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">General</div>
                <NavItem id="programs" label="Programs" />
                <NavItem id="rates" label="Rates/Fees" />
                <NavItem id="additional" label="Additional" />
              </nav>
            </aside>
            <section className="bg-background flex flex-col">
              <header className="flex h-12 items-center border-b px-6 text-sm font-semibold">
                {tab === "programs" ? "Programs" : tab === "rates" ? "Rates/Fees" : "Additional"}
              </header>
              <div className="min-h-[440px] p-6">
                {tab === "programs" ? (
                  <ProgramsList value={programVisibility} onChange={(m) => setProgramVisibility(m)} />
                ) : tab === "rates" ? (
                  <RatesFeesTable rows={rateRows} onRowsChange={setRateRows} />
                ) : (
                  <AdditionalSettings
                    allowYsp={allowYsp}
                    allowBuydown={allowBuydown}
                    onAllowYsp={setAllowYsp}
                    onAllowBuydown={setAllowBuydown}
                  />
                )}
              </div>
              <div className="border-t px-6 py-3 flex justify-end">
                <Button
                  onClick={() => {
                    ;(async () => {
                      try {
                        const body = {
                          allow_ysp: allowYsp,
                          allow_buydown_rate: allowBuydown,
                          program_visibility: programVisibility,
                          rates: rateRows.map((r) => ({
                            id: r.id,
                            min_upb: r.minUpb ?? "",
                            max_upb: r.maxUpb ?? "",
                            origination: r.origination ?? "",
                            admin_fee: r.adminFee ?? "",
                            ysp: r.ysp ?? "",
                          })),
                        }
                        const res = await fetch(`/api/brokers/${brokerId}/custom-settings`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(body),
                        })
                        const j = await res.json().catch(() => ({}))
                        if (!res.ok) throw new Error(j?.error ?? "Failed to save")
                        toast({ title: "Saved", description: "Broker settings updated." })
                        onOpenChange(false)
                        try {
                          onSaved?.()
                        } catch {
                          // ignore callback errors
                        }
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
  onAllowYsp,
  onAllowBuydown,
}: {
  allowYsp: boolean
  allowBuydown: boolean
  onAllowYsp: (v: boolean) => void
  onAllowBuydown: (v: boolean) => void
}) {
  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="text-sm font-medium">Allow broker to add YSP</div>
        <Switch checked={allowYsp} onCheckedChange={onAllowYsp} aria-label="Allow broker to add YSP" />
      </div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="text-sm font-medium">Allow brokers to buydown rate</div>
        <Switch checked={allowBuydown} onCheckedChange={onAllowBuydown} aria-label="Allow brokers to buydown rate" />
      </div>
      <p className="text-xs text-muted-foreground">Note: Toggles are UI-only for now.</p>
    </div>
  )
}

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
        const next = { ...value }
        mapped.forEach((p) => {
          if (next[p.id] === undefined) next[p.id] = true
        })
        onChange(next)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load programs")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])
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
  onRowsChange: (rows: { id: string; minUpb?: string; maxUpb?: string; origination?: string; adminFee?: string; ysp?: string }[]) => void
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
                    value={fmtMoneyDollar(row.minUpb ?? "0")}
                    onChange={(e) =>
                      onRowsChange(rows.map((r, rIdx) => (rIdx === idx ? { ...r, minUpb: sanitize(e.target.value) } : r)))
                    }
                    placeholder="0"
                  />
                ) : (
                  <span>{fmtMoneyDollar(row.minUpb ?? "")}</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {editing ? (
                  <Input
                    value={fmtMoneyDollar(row.maxUpb ?? "0")}
                    onChange={(e) =>
                      onRowsChange(rows.map((r, rIdx) => (rIdx === idx ? { ...r, maxUpb: sanitize(e.target.value) } : r)))
                    }
                    placeholder="0"
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
                  />
                ) : (
                  <span>{row.origination ?? ""}</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {editing ? (
                  <Input
                    value={fmtMoneyDollar(row.adminFee ?? "0")}
                    onChange={(e) =>
                      onRowsChange(rows.map((r, rIdx) => (rIdx === idx ? { ...r, adminFee: sanitize(e.target.value) } : r)))
                    }
                    placeholder="0"
                  />
                ) : (
                  <span>{fmtMoneyDollar(row.adminFee ?? "")}</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {editing ? (
                  <Input
                    value={row.ysp ?? ""}
                    onChange={(e) => onRowsChange(rows.map((r, rIdx) => (rIdx === idx ? { ...r, ysp: clampPercentStr(e.target.value) } : r)))}
                    placeholder="0.00"
                  />
                ) : (
                  <span>{row.ysp ?? ""}</span>
                )}
              </TableCell>
              {editing ? (
                <TableCell className="text-center">
                  <Button
                    variant="destructive"
                    size="icon"
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


