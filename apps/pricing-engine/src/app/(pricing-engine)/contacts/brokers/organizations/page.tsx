"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { useOrganization } from "@clerk/nextjs"
import { UserPlus, Loader2 } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/shadcn/breadcrumb"
import { Button } from "@repo/ui/shadcn/button"
import { Input } from "@repo/ui/shadcn/input"
import { Label } from "@repo/ui/shadcn/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog"
import { BrokerCompaniesTable } from "../../components/broker-companies-table"
import { PageSkeleton } from "@/components/ui/table-skeleton"
import type { BrokerOrgRow, OrgMemberRow } from "../../data/fetch-broker-companies"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type BrokerOrgsResponse = {
  items: BrokerOrgRow[]
  membersMap: Record<string, OrgMemberRow[]>
}

type RoleOption = { value: string; label: string }
type RolesResponse = { roles: RoleOption[] }

export default function BrokerOrganizationsPage() {
  const { data, isLoading, mutate } = useSWR<BrokerOrgsResponse>(
    "/api/brokers/companies/list",
    fetcher
  )
  const organizations = data?.items ?? []
  const membersMap = data?.membersMap ?? {}

  const { data: memberRolesData } = useSWR<RolesResponse>(
    "/api/brokers/member-roles",
    fetcher
  )
  const memberRoleOptions = memberRolesData?.roles ?? []

  const { data: orgRolesData } = useSWR<RolesResponse>(
    "/api/brokers/org-roles",
    fetcher
  )
  const orgRoleOptions = orgRolesData?.roles ?? []

  const { organization } = useOrganization()
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteOrgRole, setInviteOrgRole] = useState("org:member")
  const [inviteMemberRole, setInviteMemberRole] = useState("")
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    setInviteError(null)
    try {
      const res = await fetch("/api/brokers/invite-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailAddress: inviteEmail,
          orgRole: inviteOrgRole,
          memberRole: inviteMemberRole.trim() || inviteOrgRole,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to send invitation")
      }
      setInviteEmail("")
      setInviteOrgRole("org:member")
      setInviteMemberRole("")
      setShowInviteDialog(false)
      mutate()
    } catch (error: any) {
      console.error("Failed to invite member:", error)
      setInviteError(error?.message ?? "Failed to send invitation")
    } finally {
      setIsInviting(false)
    }
  }

  if (isLoading) {
    return <PageSkeleton title="Broker Organizations" columns={5} rows={10} />
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/contacts/brokers/individual">Brokers</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Organizations</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex-none text-xl font-bold tracking-tight">
            Broker Organizations
          </h2>
          <Button
            className="space-x-1"
            onClick={() => setShowInviteDialog(true)}
          >
            <span>Invite Members</span>
            <UserPlus size={18} />
          </Button>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <BrokerCompaniesTable data={organizations} initialMembersMap={membersMap} />
      </div>

      <Dialog
        open={showInviteDialog}
        onOpenChange={(open) => {
          setShowInviteDialog(open)
          if (!open) {
            setInviteEmail("")
            setInviteOrgRole("org:member")
            setInviteMemberRole("")
            setInviteError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a new member</DialogTitle>
            <DialogDescription>
              Send an invitation to join{" "}
              {organization?.name ?? "your organization"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInvite()
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-org-role">Organization Role</Label>
              <Select
                value={inviteOrgRole}
                onValueChange={setInviteOrgRole}
              >
                <SelectTrigger id="invite-org-role">
                  <SelectValue placeholder="Select an organization role" />
                </SelectTrigger>
                <SelectContent>
                  {orgRoleOptions.length === 0 ? (
                    <>
                      <SelectItem value="org:member">Member</SelectItem>
                      <SelectItem value="org:admin">Admin</SelectItem>
                    </>
                  ) : (
                    orgRoleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-member-role">Member Role</Label>
              <Select
                value={inviteMemberRole}
                onValueChange={setInviteMemberRole}
              >
                <SelectTrigger id="invite-member-role">
                  <SelectValue placeholder="Select a member role" />
                </SelectTrigger>
                <SelectContent>
                  {memberRoleOptions.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      No roles configured
                    </SelectItem>
                  ) : (
                    memberRoleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Synced from Organization Member Roles. Defaults to the
                Organization Role if not selected.
              </p>
            </div>
            {inviteError && (
              <p className="text-destructive text-sm">{inviteError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={isInviting || !inviteEmail.trim()}
              >
                {isInviting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Send invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
