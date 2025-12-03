"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Default Broker Settings</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-[220px_1fr] gap-4">
            <aside className="rounded-md border p-2">
              <nav className="space-y-1">
                <div className="px-2 pb-2 text-xs font-semibold uppercase text-muted-foreground">General</div>
                <NavItem id="programs" label="Programs" />
                <NavItem id="rates" label="Rates/Fees" />
                <NavItem id="additional" label="Additional" />
              </nav>
            </aside>
            <section className="rounded-md border p-4">
              {tab === "programs" ? (
                <div className="text-sm text-muted-foreground">Programs settings (placeholder)</div>
              ) : tab === "rates" ? (
                <div className="text-sm text-muted-foreground">Rates/Fees settings (placeholder)</div>
              ) : (
                <div className="text-sm text-muted-foreground">Additional settings (placeholder)</div>
              )}
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}


