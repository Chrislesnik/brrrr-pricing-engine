"use client"

import Link from "next/link"
import { IconUserPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export function UserPrimaryActions() {
  return (
    <div className="flex justify-end gap-2">
      <Button className="space-x-1" asChild>
        <Link href="/pricing">
          <span>New Loan</span> <IconUserPlus size={18} />
        </Link>
      </Button>
    </div>
  )
}
