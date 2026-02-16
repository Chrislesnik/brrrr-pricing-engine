"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconDots, IconArchive, IconSettings, IconUsers, IconRestore } from "@tabler/icons-react"
import { EntityProfile } from "../data/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/shadcn/dropdown-menu"
import { Button } from "@repo/ui/shadcn/button"
import { NewEntityModal } from "./new-entity-modal"
import { RoleAssignmentDialog } from "@/components/role-assignment-dialog"
import { ArchiveConfirmDialog } from "@/components/archive"

/** Parse a YYYY-MM-DD string into a local-timezone Date (avoids UTC offset shift). */
function parseDateLocal(s: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s))
  if (!m) return undefined
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? undefined : d
}

interface Props {
  entity: EntityProfile
}

export function EntityRowActions({ entity }: Props) {
  const [openEdit, setOpenEdit] = React.useState(false)
  const [initial, setInitial] = React.useState<Record<string, any> | undefined>(undefined)
  const [ownersInitial, setOwnersInitial] = React.useState<
    {
      id: string
      name: string
      title: string
      memberType: "Individual" | "Entity" | ""
      ssnEin: string
      showSsn?: boolean
      guarantor: "Yes" | "No" | ""
      percent: string
      address: string
      borrowerId?: string
      borrower_id?: string
      entityOwnerId?: string
      entity_owner_id?: string
    }[]
      | undefined
  >(undefined)
  const [openAssign, setOpenAssign] = React.useState(false)
  const [openArchiveConfirm, setOpenArchiveConfirm] = React.useState(false)
  const [archiving, setArchiving] = React.useState(false)
  const router = useRouter()

  const isArchived = !!(entity as any).archived_at

  async function archiveEntity() {
    setArchiving(true)
    try {
      const res = await fetch(`/api/applicants/entities/${encodeURIComponent(entity.id)}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
      setOpenArchiveConfirm(false)
      router.refresh()
      if (typeof window !== "undefined") window.dispatchEvent(new Event("app:entities:changed"))
    } catch (e) {
      console.error(e)
    } finally {
      setArchiving(false)
    }
  }

  async function restoreEntity() {
    setArchiving(true)
    try {
      const res = await fetch(`/api/applicants/entities/${encodeURIComponent(entity.id)}?action=restore`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
      router.refresh()
      if (typeof window !== "undefined") window.dispatchEvent(new Event("app:entities:changed"))
    } catch (e) {
      console.error(e)
    } finally {
      setArchiving(false)
    }
  }

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
        date_formed: e.date_formed ? parseDateLocal(e.date_formed) : undefined,
        state_formed: e.state_formed ?? "",
        address_line1: e.address_line1 ?? "",
        address_line2: e.address_line2 ?? "",
        city: e.city ?? "",
        state: e.state ?? "",
        zip: e.zip ?? "",
        county: e.county ?? "",
      }
      setInitial(init)
      // Load owners for Schedule A
      try {
        const ores = await fetch(`/api/applicants/entities/${encodeURIComponent(entity.id)}/owners`, { cache: "no-store" })
        const oj = (await ores.json().catch(() => ({}))) as { owners?: any[] }
        const mapped = await Promise.all(
          (oj.owners ?? []).map(async (o) => {
            const memberType = (o.member_type as any) ?? ""
            let ssnEin = (o.full_ssn as string) ?? ""
            let ssnEncrypted = (o as any)?.ssn_encrypted ?? null
            let ssnLast4 = (o as any)?.ssn_last4 ?? null
            let ein = (o as any)?.ein ?? null
            // Use decrypted full SSN from API when available
            if (memberType === "Individual" && !ssnEin && (o as any)?.full_ssn) {
              const digits = String((o as any).full_ssn).replace(/\D+/g, "")
              if (digits.length === 9) {
                ssnEin = digits
                ssnLast4 = digits.slice(-4)
              }
            }

            // Hydrate linked borrower SSN when available
            const borrowerId = (o as any).borrower_id as string | undefined
            if (memberType === "Individual" && borrowerId) {
              try {
                const ssnRes = await fetch(`/api/applicants/borrowers/${encodeURIComponent(borrowerId)}/ssn`, { cache: "no-store" })
                if (ssnRes.ok) {
                  const s = await ssnRes.json().catch(() => ({} as any))
                  const digits = String(s?.ssn ?? "").replace(/\D+/g, "").slice(0, 9)
                  if (digits.length === 9) {
                    ssnEin = digits
                    ssnEncrypted = (o as any)?.ssn_encrypted ?? null
                    ssnLast4 = digits.slice(-4)
                  }
                }
              } catch {
                // ignore hydration errors
              }
            }

            // Hydrate linked entity EIN when available
            const linkedEntityId = (o as any).entity_owner_id as string | undefined
            if (memberType === "Entity" && linkedEntityId) {
              const preloaded = (o as any).entity_ein as string | undefined
              if (preloaded && preloaded.length > 0) {
                ein = String(preloaded).replace(/\D+/g, "").slice(0, 9)
              } else {
                try {
                  const entRes = await fetch(`/api/applicants/entities/${encodeURIComponent(linkedEntityId)}`, { cache: "no-store" })
                  if (entRes.ok) {
                    const ej = await entRes.json().catch(() => ({} as any))
                    const entEin = String((ej?.entity ?? {}).ein ?? "").replace(/\D+/g, "").slice(0, 9)
                    if (entEin.length > 0) ein = entEin
                  }
                } catch {
                  // ignore hydration errors
                }
              }
            }

            // SSN should always be hidden by default when modal opens
            const showSsn = false

            return {
              id: crypto.randomUUID(),
              name: o.name ?? "",
              title: o.title ?? "",
              memberType,
              ssnEin,
              ssnEncrypted,
              ssnLast4,
              ein,
              showSsn,
              guarantor: (o.guarantor === true ? "Yes" : o.guarantor === false ? "No" : "") as "" | "Yes" | "No",
              percent: o.ownership_percent != null ? String(o.ownership_percent) : "",
              address: o.address ?? "",
              borrowerId: borrowerId ?? undefined,
              borrower_id: borrowerId ?? undefined,
              entityOwnerId: linkedEntityId ?? undefined,
              entity_owner_id: linkedEntityId ?? undefined,
            }
          })
        )
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
        date_formed: entity.date_formed ? parseDateLocal(entity.date_formed) : undefined,
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
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              e.stopPropagation()
              openSettings()
            }}
          >
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
                restoreEntity()
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

      <NewEntityModal open={openEdit} onOpenChange={setOpenEdit} entityId={entity.id} initial={initial} ownersInitial={ownersInitial} />
      <RoleAssignmentDialog
        resourceType="entity"
        resourceId={entity.id}
        open={openAssign}
        onOpenChange={setOpenAssign}
        onSaved={() => window.dispatchEvent(new Event("app:entities:changed"))}
      />

      <ArchiveConfirmDialog
        open={openArchiveConfirm}
        onOpenChange={setOpenArchiveConfirm}
        onConfirm={archiveEntity}
        recordType="entity"
        loading={archiving}
      />
    </>
  )
}


