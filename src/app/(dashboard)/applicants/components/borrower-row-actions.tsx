"use client"

import * as React from "react"
import { IconDots, IconTrash, IconUserCog } from "@tabler/icons-react"
import { Borrower } from "../data/types"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { NewBorrowerModal } from "./new-borrower-modal"
import { BorrowerAssignMembersDialog } from "./borrower-assign-dialog"

interface Props {
  borrower: Borrower
}

export function BorrowerRowActions({ borrower }: Props) {
  const [openEdit, setOpenEdit] = React.useState(false)
  const [openAssign, setOpenAssign] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [initial, setInitial] = React.useState<Record<string, any> | undefined>(undefined)
  const [openDeleteConfirm, setOpenDeleteConfirm] = React.useState(false)

  async function deleteBorrower() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/applicants/borrowers/${encodeURIComponent(borrower.id)}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error(await res.text())
      // notify table to refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("app:borrowers:changed"))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  async function openSettings() {
    try {
      const res = await fetch(`/api/applicants/borrowers/${encodeURIComponent(borrower.id)}`, { cache: "no-store" })
      const j = (await res.json().catch(() => ({}))) as { borrower?: any }
      const b = j.borrower ?? {}
      // If SSN exists, fetch full value so modal opens preloaded (hidden)
      let ssn_full: string | undefined = undefined
      if (b?.has_ssn) {
        try {
          const ssnRes = await fetch(`/api/applicants/borrowers/${encodeURIComponent(borrower.id)}/ssn`, { cache: "no-store" })
          if (ssnRes.ok) {
            const s = await ssnRes.json().catch(() => ({} as any))
            const digits = String(s?.ssn ?? "").replace(/\D+/g, "")
            if (digits.length === 9) ssn_full = digits
          }
        } catch {
          // ignore
        }
      }
      // Map DB row -> form initial values; SSN is not recoverable, leave blank
      const init: Record<string, any> = {
        first_name: b.first_name ?? "",
        last_name: b.last_name ?? "",
        has_ssn: Boolean(b.has_ssn),
        ssn_last4: b.ssn_last4 ?? null,
        ssn_full,
        email: b.email ?? "",
        primary_phone: b.primary_phone ?? "",
        alt_phone: b.alt_phone ?? "",
        date_of_birth: b.date_of_birth ? new Date(b.date_of_birth) : undefined,
        fico_score: b.fico_score ?? undefined,
        address_line1: b.address_line1 ?? "",
        address_line2: b.address_line2 ?? "",
        city: b.city ?? "",
        state: b.state ?? "",
        zip: b.zip ?? "",
        county: b.county ?? "",
        rentals_owned: b.rentals_owned ?? undefined,
        fix_flips_3yrs: b.fix_flips_3yrs ?? undefined,
        groundups_3yrs: b.groundups_3yrs ?? undefined,
        real_estate_licensed: typeof b.real_estate_licensed === "boolean" ? b.real_estate_licensed : undefined,
        citizenship: b.citizenship ?? undefined,
        visa: typeof b.visa === "boolean" ? b.visa : undefined,
        visa_type: b.visa_type ?? "",
      }
      setInitial(init)
      setOpenEdit(true)
    } catch {
      // Fallback: open with whatever we have
      setInitial({
        first_name: borrower.first_name ?? "",
        last_name: borrower.last_name ?? "",
        email: borrower.email ?? "",
        primary_phone: (borrower as any).primary_phone ?? "",
        alt_phone: (borrower as any).alt_phone ?? "",
        date_of_birth: borrower.date_of_birth ? new Date(borrower.date_of_birth) : undefined,
      })
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
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={openDeleteConfirm} onOpenChange={setOpenDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete borrower?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this borrower record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteBorrower} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit modal reuse NewBorrower with initial values */}
      <NewBorrowerModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        borrowerId={borrower.id}
        initial={initial}
      />

      <BorrowerAssignMembersDialog
        borrowerId={borrower.id}
        open={openAssign}
        onOpenChange={setOpenAssign}
      />
    </>
  )
}


