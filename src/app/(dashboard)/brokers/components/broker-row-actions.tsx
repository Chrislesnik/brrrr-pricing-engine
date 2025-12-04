"use client"

import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { IconDotsVertical } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { BrokerSettingsDialog } from "./broker-settings-dialog"
import { toast } from "@/hooks/use-toast"

export default function RowActions({ brokerId, status }: { brokerId: string; status?: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = useState<string>(String(status ?? "").toLowerCase())
  const canToggle = currentStatus === "active" || currentStatus === "inactive"
  const opposite = currentStatus === "active" ? "inactive" : "active"
  // Keep the menu label in sync if status changes elsewhere
  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    function onUpdate(e: Event) {
      const ce = e as CustomEvent<{ id: string; status: string }>
      if (ce.detail?.id === brokerId) {
        setCurrentStatus(String(ce.detail.status || "").toLowerCase())
      }
    }
    window.addEventListener("broker-status-updated", onUpdate as EventListener)
    return () => window.removeEventListener("broker-status-updated", onUpdate as EventListener)
  }, [brokerId])
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Row actions">
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setOpen(true)}>Broker settings</DropdownMenuItem>
          {canToggle ? (
            <DropdownMenuItem
            onSelect={() => {
              ;(async () => {
                try {
                  const res = await fetch(`/api/brokers/${brokerId}/status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "toggle" }),
                  })
                  const j = await res.json().catch(() => ({}))
                  if (!res.ok) throw new Error(j?.error ?? "Failed to update status")
                  const newStatus = String(j?.status ?? "").toLowerCase()
                  // Optimistic in-place update for the status badge only (no full page refresh)
                  window.dispatchEvent(new CustomEvent("broker-status-updated", { detail: { id: brokerId, status: newStatus } }))
                  setCurrentStatus(newStatus)
                  toast({ title: "Updated", description: `Status switched to ${newStatus.toUpperCase()}.` })
                } catch (e) {
                  toast({
                    title: "Update failed",
                    description: e instanceof Error ? e.message : "Unknown error",
                    variant: "destructive",
                  })
                }
              })()
            }}
          >
            {`Switch to ${opposite}`}
          </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {open ? (
        <BrokerSettingsDialog
          brokerId={brokerId}
          open={open}
          onOpenChange={setOpen}
          onSaved={() => {
            router.refresh()
          }}
        />
      ) : null}
    </>
  )
}

