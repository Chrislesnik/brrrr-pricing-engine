"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/shadcn/alert-dialog"
import { Button } from "@repo/ui/shadcn/button"
import { Input } from "@repo/ui/shadcn/input"

const CONFIRMATION_PHRASE = "permanently delete"

interface PermanentDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  recordType?: string
  loading?: boolean
}

export function PermanentDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  recordType = "record",
  loading = false,
}: PermanentDeleteDialogProps) {
  const [typed, setTyped] = React.useState("")
  const confirmed = typed.trim().toLowerCase() === CONFIRMATION_PHRASE

  // Reset typed text when dialog opens/closes
  React.useEffect(() => {
    if (!open) setTyped("")
  }, [open])

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-1.5 mb-2 w-fit">
            <span className="text-sm font-semibold text-destructive">Danger Zone</span>
          </div>
          <AlertDialogTitle>Permanently delete this {recordType}?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span className="block">
              This will permanently delete this {recordType} and all associated
              data. <strong className="text-foreground">This action cannot be undone.</strong>
            </span>
            <span className="block text-sm">
              To confirm, type{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                {CONFIRMATION_PHRASE}
              </code>{" "}
              below:
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={CONFIRMATION_PHRASE}
          className="font-mono"
          autoComplete="off"
          autoFocus
        />

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!confirmed || loading}
          >
            {loading ? "Deleting..." : "Permanently Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
