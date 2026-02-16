"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@repo/ui/shadcn/dialog"
import { Button } from "@repo/ui/shadcn/button"
import { cn } from "@repo/lib/cn"
import { toast } from "@/hooks/use-toast"
import {
  AdditionalSettings,
  ProgramsLoader,
  ProgramsList,
  RatesFeesTable,
  type RateRow,
} from "./broker-settings-shared"

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
  const [rateRows, setRateRows] = useState<RateRow[]>([])
  const [allowYsp, setAllowYsp] = useState<boolean>(false)
  const [allowBuydown, setAllowBuydown] = useState<boolean>(false)
  const [allowWhiteLabeling, setAllowWhiteLabeling] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)

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
        setAllowWhiteLabeling(j.allow_white_labeling === true)
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

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = {
        allow_ysp: allowYsp,
        allow_buydown_rate: allowBuydown,
        allow_white_labeling: allowWhiteLabeling,
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
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {open && tab === "programs" ? <ProgramsLoader /> : null}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[920px] p-0 overflow-hidden max-h-[85vh] min-h-[560px]">
          <DialogTitle className="sr-only">Broker Settings</DialogTitle>
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
              <div className="flex-1 p-6 overflow-y-auto max-h-[60vh]">
                {tab === "programs" ? (
                  <ProgramsList value={programVisibility} onChange={(m) => setProgramVisibility(m)} />
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
              <div className="border-t px-6 py-3 flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
