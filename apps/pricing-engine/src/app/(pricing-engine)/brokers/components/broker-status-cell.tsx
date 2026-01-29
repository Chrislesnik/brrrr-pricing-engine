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
      ? "bg-green-100 text-green-800 border-green-200"
      : s === "inactive"
      ? "bg-red-100 text-red-800 border-red-200"
      : "bg-yellow-100 text-yellow-800 border-yellow-200"

  return <Badge variant="outline" className={cn("capitalize", color)}>{s || "-"}</Badge>
}


