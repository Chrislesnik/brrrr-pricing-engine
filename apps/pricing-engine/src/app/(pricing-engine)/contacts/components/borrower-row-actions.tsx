"use client"

import * as React from "react"
import {
  IconDots,
  IconArchive,
  IconSettings,
  IconUsers,
  IconRestore,
} from "@tabler/icons-react"
import { Button } from "@repo/ui/shadcn/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu"
import { Borrower } from "../data/types"
import { RoleAssignmentDialog } from "@/components/role-assignment-dialog"
import { NewBorrowerModal } from "./new-borrower-modal"
import { ArchiveConfirmDialog } from "@/components/archive"

interface Props {
  borrower: Borrower
}

export function BorrowerRowActions({ borrower }: Props) {
  const [openEdit, setOpenEdit] = React.useState(false)
  const [openAssign, setOpenAssign] = React.useState(false)
  const [archiving, setArchiving] = React.useState(false)
  const [initial, setInitial] = React.useState<Record<string, any> | undefined>(
    undefined
  )
  const [openArchiveConfirm, setOpenArchiveConfirm] = React.useState(false)

  const isArchived = !!(borrower as any).archived_at

  async function archiveBorrower() {
    setArchiving(true)
    try {
      const res = await fetch(
        `/api/applicants/borrowers/${encodeURIComponent(borrower.id)}`,
        {
          method: "DELETE",
        }
      )
      if (!res.ok) throw new Error(await res.text())
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("app:borrowers:changed"))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setArchiving(false)
    }
  }

  async function restoreBorrower() {
    setArchiving(true)
    try {
      const res = await fetch(
        `/api/applicants/borrowers/${encodeURIComponent(borrower.id)}?action=restore`,
        {
          method: "DELETE",
        }
      )
      if (!res.ok) throw new Error(await res.text())
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("app:borrowers:changed"))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setArchiving(false)
    }
  }

  async function openSettings() {
    try {
      const res = await fetch(
        `/api/applicants/borrowers/${encodeURIComponent(borrower.id)}`,
        { cache: "no-store" }
      )
      const j = (await res.json().catch(() => ({}))) as { borrower?: any }
      const b = j.borrower ?? {}
      // Map DB row -> form initial values; SSN is not recoverable, leave blank
      const toLocalDate = (
        ymd: string | null | undefined
      ): Date | undefined => {
        if (!ymd) return undefined
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd))
        if (!m) return undefined
        const y = Number(m[1])
        const mo = Number(m[2])
        const d = Number(m[3])
        return new Date(y, mo - 1, d)
      }
      const init: Record<string, any> = {
        first_name: b.first_name ?? "",
        last_name: b.last_name ?? "",
        has_ssn: Boolean(b.has_ssn),
        ssn_last4: b.ssn_last4 ?? null,
        email: b.email ?? "",
        primary_phone: b.primary_phone ?? "",
        alt_phone: b.alt_phone ?? "",
        date_of_birth: toLocalDate(b.date_of_birth),
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
        real_estate_licensed:
          typeof b.real_estate_licensed === "boolean"
            ? b.real_estate_licensed
            : undefined,
        citizenship: b.citizenship ?? undefined,
        visa: typeof b.visa === "boolean" ? b.visa : undefined,
        visa_type: b.visa_type ?? "",
      }
      setInitial(init)
      setOpenEdit(true)
    } catch {
      // Fallback: open with whatever we have
      const toLocalDate2 = (
        ymd: string | null | undefined
      ): Date | undefined => {
        if (!ymd) return undefined
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd))
        if (!m) return undefined
        const y = Number(m[1])
        const mo = Number(m[2])
        const d = Number(m[3])
        return new Date(y, mo - 1, d)
      }
      setInitial({
        first_name: borrower.first_name ?? "",
        last_name: borrower.last_name ?? "",
        email: borrower.email ?? "",
        primary_phone: (borrower as any).primary_phone ?? "",
        alt_phone: (borrower as any).alt_phone ?? "",
        date_of_birth: toLocalDate2(borrower.date_of_birth),
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
            <IconSettings className="mr-2 h-4 w-4" />
            Open Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenAssign(true)}>
            <IconUsers className="mr-2 h-4 w-4" />
            Assigned To
          </DropdownMenuItem>
          {isArchived ? (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                restoreBorrower()
              }}
              disabled={archiving}
            >
              <IconRestore className="mr-2 h-4 w-4" />
              {archiving ? "Restoring..." : "Restore"}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-red-600"
              onSelect={(e) => {
                e.preventDefault()
                setOpenArchiveConfirm(true)
              }}
            >
              <IconArchive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ArchiveConfirmDialog
        open={openArchiveConfirm}
        onOpenChange={setOpenArchiveConfirm}
        onConfirm={archiveBorrower}
        recordType="borrower"
        loading={archiving}
      />

      {/* Edit modal reuse NewBorrower with initial values */}
      <NewBorrowerModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        borrowerId={borrower.id}
        initial={initial}
      />

      <RoleAssignmentDialog
        resourceType="borrower"
        resourceId={borrower.id}
        open={openAssign}
        onOpenChange={setOpenAssign}
        onSaved={() => window.dispatchEvent(new Event("app:borrowers:changed"))}
      />
    </>
  )
}
