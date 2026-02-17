"use client"

import { useCallback, useMemo, useState } from "react"
import useSWR from "swr"
import { UserPlus } from "lucide-react"
import { Button } from "@repo/ui/shadcn/button"
import { BrokerCompaniesTable } from "../../components/broker-companies-table"
import { PageSkeleton } from "@/components/ui/table-skeleton"
import { InviteMemberDialog } from "@/components/invite-member-dialog"
import type { BrokerOrgRow, OrgMemberRow } from "../../data/fetch-broker-companies"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type BrokerOrgsResponse = {
  items: BrokerOrgRow[]
  membersMap: Record<string, OrgMemberRow[]>
  isActiveOrgInternal: boolean
  activeOrgSupabaseId: string | null
}

export default function BrokerOrganizationsPage() {
  const { data, isLoading, mutate } = useSWR<BrokerOrgsResponse>(
    "/api/brokers/companies/list",
    fetcher
  )
  const organizations = data?.items ?? []
  const membersMap = data?.membersMap ?? {}
  const isActiveOrgInternal = data?.isActiveOrgInternal ?? false
  const activeOrgSupabaseId = data?.activeOrgSupabaseId ?? null

  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteTargetOrgId, setInviteTargetOrgId] = useState<string | undefined>()
  // Track whether the dialog was opened from a row action (always read-only)
  const [fromRowAction, setFromRowAction] = useState(false)

  // Build org options for the dialog dropdown from the fetched data
  const orgOptions = useMemo(
    () => organizations.map((o) => ({ id: o.id, name: o.name })),
    [organizations]
  )

  // Opens the invite dialog pre-selected to a specific org (row action → always read-only)
  const handleRowInvite = useCallback((orgId: string) => {
    setInviteTargetOrgId(orgId)
    setFromRowAction(true)
    setShowInviteDialog(true)
  }, [])

  // Opens the invite dialog from the header button.
  // When the active org is external, pre-select it (and lock the dropdown).
  // When internal, leave unselected so the user can pick any org.
  const handleHeaderInvite = useCallback(() => {
    setInviteTargetOrgId(
      !isActiveOrgInternal && activeOrgSupabaseId
        ? activeOrgSupabaseId
        : undefined
    )
    setFromRowAction(false)
    setShowInviteDialog(true)
  }, [isActiveOrgInternal, activeOrgSupabaseId])

  // Organization dropdown is read-only when:
  // (a) opened from a row action, or
  // (b) the caller's active org is external
  const orgReadOnly = fromRowAction || !isActiveOrgInternal

  if (isLoading) {
    return <PageSkeleton title="Broker Organizations" columns={6} rows={10} />
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex-none text-xl font-bold tracking-tight">
            Broker Organizations
          </h2>
          <Button
            className="space-x-1"
            onClick={handleHeaderInvite}
          >
            <span>Invite Members</span>
            <UserPlus size={18} />
          </Button>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <BrokerCompaniesTable
          data={organizations}
          initialMembersMap={membersMap}
          onInviteMembers={handleRowInvite}
        />
      </div>

      <InviteMemberDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onSuccess={() => mutate()}
        organizations={orgOptions}
        preSelectedOrgId={inviteTargetOrgId}
        orgReadOnly={orgReadOnly}
      />
    </>
  )
}
