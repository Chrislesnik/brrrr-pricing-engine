"use client"

import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { IconDotsVertical } from "@tabler/icons-react"
import { BrokerSettingsDialog } from "./broker-settings-dialog"
import { useRouter } from "next/navigation"

export default function RowActions({ brokerId }: { brokerId: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
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

