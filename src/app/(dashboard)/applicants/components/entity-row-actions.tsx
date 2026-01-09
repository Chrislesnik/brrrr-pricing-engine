"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconDots, IconTrash, IconUserCog } from "@tabler/icons-react"
import { EntityProfile } from "../data/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { NewEntityModal } from "./new-entity-modal"
import { EntityAssignMembersDialog } from "./entity-assign-dialog"

interface Props {
  entity: EntityProfile
}

export function EntityRowActions({ entity }: Props) {
  const [openEdit, setOpenEdit] = React.useState(false)
  const [initial, setInitial] = React.useState<Record<string, any> | undefined>(undefined)
  const [ownersInitial, setOwnersInitial] = React.useState<
    { id: string; name: string; title: string; memberType: "Individual" | "Entity" | ""; ssnEin: string; guarantor: "Yes" | "No" | ""; percent: string; address: string }[] | undefined
  >(undefined)
  const [openAssign, setOpenAssign] = React.useState(false)
  const [openDeleteConfirm, setOpenDeleteConfirm] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const router = useRouter()

  async function openSettings() {
    try {
      // Fetch latest entity row (light detail) from base view
      const res = await fetch(`/api/applicants/entities/${encodeURIComponent(entity.id)}`, { cache: "no-store" })
      const j = (await res.json().catch(() => ({}))) as { entity?: any }
      const e = j.entity ?? {}
      const init: Record<string, any> = {
        legal_name: e.entity_name ?? "",
        entity_type: e.entity_type ?? "",
        members: e.members ?? undefined,
        ein: e.ein ?? "",
        date_formed: e.date_formed ? new Date(e.date_formed) : undefined,
        state_formed: e.state_formed ?? "",
        address_line1: e.address_line1 ?? "",
        address_line2: e.address_line2 ?? "",
        city: e.city ?? "",
        state: e.state ?? "",
        zip: e.zip ?? "",
        county: e.county ?? "",
        bank_name: e.bank_name ?? "",
        account_balances: e.account_balances ?? "",
      }
      setInitial(init)
      // Load owners for Schedule A
      try {
        const ores = await fetch(`/api/applicants/entities/${encodeURIComponent(entity.id)}/owners`, { cache: "no-store" })
        const oj = (await ores.json().catch(() => ({}))) as { owners?: any[] }
        const mapped = (oj.owners ?? []).map((o) => ({
          id: crypto.randomUUID(),
          name: o.name ?? "",
          title: o.title ?? "",
          memberType: (o.member_type as any) ?? "",
          ssnEin: (o.id_number as string) ?? "",
          guarantor: o.guarantor === true ? "Yes" : o.guarantor === false ? "No" : "",
          percent: o.ownership_percent != null ? String(o.ownership_percent) : "",
          address: o.address ?? "",
          borrowerId: (o as any).borrower_id ?? undefined,
          borrower_id: (o as any).borrower_id ?? undefined,
        }))
        setOwnersInitial(mapped)
      } catch {
        setOwnersInitial(undefined)
      }
      setOpenEdit(true)
    } catch {
      setInitial({
        legal_name: entity.entity_name ?? "",
        entity_type: entity.entity_type ?? "",
        ein: entity.ein ?? "",
        date_formed: entity.date_formed ? new Date(entity.date_formed) : undefined,
      })
      setOwnersInitial(undefined)
      setOpenEdit(true)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <IconDots className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={openSettings}>
            <IconUserCog className="mr-2 h-4 w-4" />
            Open Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenAssign(true)}>
            Assigned To
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onSelect={(e) => {
              e.preventDefault()
              setOpenDeleteConfirm(true)
            }}
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NewEntityModal open={openEdit} onOpenChange={setOpenEdit} entityId={entity.id} initial={initial} ownersInitial={ownersInitial} />
      <EntityAssignMembersDialog entityId={entity.id} open={openAssign} onOpenChange={setOpenAssign} />

      <AlertDialog open={openDeleteConfirm} onOpenChange={setOpenDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete entity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this entity record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setDeleting(true)
                try {
                  const res = await fetch(`/api/applicants/entities/${encodeURIComponent(entity.id)}`, { method: "DELETE" })
                  if (!res.ok) throw new Error(await res.text())
                  setOpenDeleteConfirm(false)
                  router.refresh()
                  if (typeof window !== "undefined") window.dispatchEvent(new Event("app:entities:changed"))
                } catch (e) {
                  // eslint-disable-next-line no-console
                  console.error(e)
                } finally {
                  setDeleting(false)
                }
              }}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}


