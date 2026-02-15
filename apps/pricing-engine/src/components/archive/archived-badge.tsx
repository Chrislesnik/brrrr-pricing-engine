"use client"

import { Badge } from "@repo/ui/shadcn/badge"

interface ArchivedBadgeProps {
  className?: string
}

export function ArchivedBadge({ className }: ArchivedBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={`text-xs font-normal opacity-70 ${className ?? ""}`}
    >
      Archived
    </Badge>
  )
}
