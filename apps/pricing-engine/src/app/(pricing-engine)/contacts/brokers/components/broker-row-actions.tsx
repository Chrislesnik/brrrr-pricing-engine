"use client"

import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/shadcn/dropdown-menu"
import { Button } from "@repo/ui/shadcn/button"
import { IconDotsVertical } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { BrokerSettingsDialog } from "./broker-settings-dialog"

export default function RowActions({ brokerOrgId }: { brokerOrgId: string }) {
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
          brokerOrgId={brokerOrgId}
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
