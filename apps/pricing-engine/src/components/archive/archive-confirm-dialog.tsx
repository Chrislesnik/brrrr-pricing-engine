"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/shadcn/alert-dialog"

interface ArchiveConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  /** The type of record being archived, e.g. "borrower", "deal", "loan" */
  recordType?: string
  /** Loading state for the confirm button */
  loading?: boolean
}

export function ArchiveConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  recordType = "record",
  loading = false,
}: ArchiveConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive {recordType}?</AlertDialogTitle>
          <AlertDialogDescription>
            This {recordType} will be archived and hidden from view. You can
            restore it later from the archived items.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading}>
            {loading ? "Archiving..." : "Archive"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
