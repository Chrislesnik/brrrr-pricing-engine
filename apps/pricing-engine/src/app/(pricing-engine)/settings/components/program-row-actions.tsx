"use client"

import { useState, useTransition } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "@repo/ui/shadcn/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu"
import { ConfirmDialog } from "@repo/ui/custom/confirm-dialog"
import { toast } from "@/hooks/use-toast"
import { EditProgramDialog, ProgramRow } from "./edit-program-dialog"

interface Props {
  program: ProgramRow
  updateAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>
  deleteAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>
  orgId?: string | null
}

export function ProgramRowActions({ program, updateAction, deleteAction, orgId }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleDelete = () => {
    const fd = new FormData()
    fd.set("id", program.id)
    if (orgId) fd.set("orgId", orgId)
    startTransition(async () => {
      const res = await deleteAction(fd)
      if (!res.ok) {
        toast({
          title: "Delete failed",
          description: res.error ?? "Unable to delete this program.",
          variant: "destructive",
        })
        return
      }
      setConfirmOpen(false)
      toast({ title: "Program deleted" })
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open row actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => setEditOpen(true)} className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setConfirmOpen(true)}
            className="gap-2 text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditProgramDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        program={program}
        action={updateAction}
        orgId={orgId}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        handleConfirm={handleDelete}
        isLoading={pending}
        destructive
        title="Delete program?"
        desc="This action cannot be undone. This will permanently delete the selected program."
        confirmText="Delete"
      />
    </>
  )
}


