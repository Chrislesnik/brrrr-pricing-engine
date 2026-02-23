"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@repo/ui/shadcn/button"
import { NewBorrowerModal } from "./new-borrower-modal"
import { NewEntityModal } from "./new-entity-modal"

export function ApplicantsPrimaryActions({
  label,
  href: _href,
  type,
}: {
  label: string
  href: string
  type: "borrower" | "entity"
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" className="h-8" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {label}
      </Button>
      {type === "borrower" ? (
        <NewBorrowerModal open={open} onOpenChange={setOpen} />
      ) : (
        <NewEntityModal open={open} onOpenChange={setOpen} />
      )}
    </>
  )
}
