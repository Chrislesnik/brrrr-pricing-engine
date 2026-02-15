"use client"

import { useState, useTransition } from "react"
import { MoreHorizontal, Pencil, Archive } from "lucide-react"
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

  const handleArchive = () => {
    const fd = new FormData()
    fd.set("id", program.id)
    if (orgId) fd.set("orgId", orgId)
    startTransition(async () => {
      const res = await deleteAction(fd)
      if (!res.ok) {
        toast({
          title: "Archive failed",
          description: res.error ?? "Unable to archive this program.",
          variant: "destructive",
        })
        return
      }
      setConfirmOpen(false)
      toast({ title: "Program archived", description: "You can restore it later." })
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
            <Archive className="h-4 w-4" />
            Archive
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
        handleConfirm={handleArchive}
        isLoading={pending}
        destructive
        title="Archive program?"
        desc="This program will be archived and hidden from view. You can restore it later."
        confirmText="Archive"
      />
    </>
  )
}


