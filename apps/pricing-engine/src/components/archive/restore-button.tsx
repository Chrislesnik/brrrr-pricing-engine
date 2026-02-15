"use client"

import * as React from "react"
import { Button } from "@repo/ui/shadcn/button"

interface RestoreButtonProps {
  onRestore: () => void | Promise<void>
  loading?: boolean
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  className?: string
}

export function RestoreButton({
  onRestore,
  loading = false,
  size = "sm",
  variant = "outline",
  className,
}: RestoreButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onRestore}
      disabled={loading}
      className={className}
    >
      {loading ? "Restoring..." : "Restore"}
    </Button>
  )
}
