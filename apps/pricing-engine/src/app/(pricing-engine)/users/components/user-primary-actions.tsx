"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@repo/ui/shadcn/button"

export function UserPrimaryActions() {
  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" className="h-8" asChild>
        <Link href="/pricing">
          <Plus className="mr-2 h-4 w-4" />
          New Loan
        </Link>
      </Button>
    </div>
  )
}
