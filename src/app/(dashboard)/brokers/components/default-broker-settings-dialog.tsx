"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

export function DefaultBrokerSettingsDialog() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"programs" | "rates" | "additional">("programs")

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
            <section className="bg-background">
              <header className="flex h-12 items-center border-b px-6 text-sm font-semibold">
                {tab === "programs" ? "Programs" : tab === "rates" ? "Rates/Fees" : "Additional"}
              </header>
              <div className="min-h-[440px] p-6">
                {tab === "programs" ? (
                  <ProgramsList />
                ) : tab === "rates" ? (
                  <div className="text-sm text-muted-foreground">Rates/Fees settings (placeholder)</div>
                ) : (
                  <div className="text-sm text-muted-foreground">Additional settings (placeholder)</div>
                )}
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Lightweight loader to prefetch data
function ProgramsLoader() {
  useEffect(() => {
    void fetch("/api/org/programs").catch(() => undefined)
  }, [])
  return null
}

function ProgramsList() {
  const [items, setItems] = useState<
    { id: string; internal_name: string; external_name: string; loan_type: string }[] | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>({})
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
        setVisibilityMap((prev) => {
          const next = { ...prev }
          mapped.forEach((p) => {
            if (next[p.id] === undefined) next[p.id] = true
          })
          return next
        })
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
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 rounded-md border bg-muted/30 p-2 text-xs font-semibold uppercase text-muted-foreground">
        <div>Program</div>
        <div>Loan Type</div>
        <div>Visibility</div>
      </div>
      <div className="space-y-1">
        {items.map((p) => (
          <div key={p.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-md border p-2 text-sm">
            <div className="min-w-0">
              <div className="truncate font-semibold">{p.internal_name}</div>
              <div className="truncate text-muted-foreground text-xs">{p.external_name}</div>
            </div>
            <div className="uppercase text-xs md:text-sm">{p.loan_type}</div>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs text-muted-foreground">Visibility</span>
              <Switch
                checked={!!visibilityMap[p.id]}
                onCheckedChange={(v) => setVisibilityMap((m) => ({ ...m, [p.id]: v }))}
                aria-label={`Toggle visibility for ${p.internal_name}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


