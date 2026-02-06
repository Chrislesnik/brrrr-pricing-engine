"use client"

import * as React from "react"
import { Badge } from "@repo/ui/shadcn/badge"
import { cn } from "@repo/lib/cn"

export function BrokerStatusCell({ id, initialStatus }: { id: string; initialStatus: string }) {
  const [status, setStatus] = React.useState<string>(initialStatus)

  React.useEffect(() => {
    function onUpdate(e: Event) {
      const ce = e as CustomEvent<{ id: string; status: string }>
      if (ce.detail?.id === id) {
        setStatus(ce.detail.status)
      }
    }
    window.addEventListener("broker-status-updated", onUpdate as EventListener)
    return () => window.removeEventListener("broker-status-updated", onUpdate as EventListener)
  }, [id])

  const s = (status || "").toLowerCase()
  const color =
    s === "active"
      ? "bg-success-muted text-success border-success/30"
      : s === "inactive"
      ? "bg-danger-muted text-danger border-danger/30"
      : "bg-warning-muted text-warning-foreground border-warning/30"

  return <Badge variant="outline" className={cn("capitalize", color)}>{s || "-"}</Badge>
}


