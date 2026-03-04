"use client"

import * as React from "react"
import { Label } from "@repo/ui/shadcn/label"
import { Switch } from "@repo/ui/shadcn/switch"

interface ShowArchivedToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
  className?: string
}

export function ShowArchivedToggle({
  checked,
  onCheckedChange,
  label = "Show Archived",
  className,
}: ShowArchivedToggleProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Switch
        id="show-archived"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <Label
        htmlFor="show-archived"
        className="text-sm text-muted-foreground cursor-pointer select-none"
      >
        {label}
      </Label>
    </div>
  )
}
