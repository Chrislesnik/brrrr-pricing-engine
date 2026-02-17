"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { useOrganization } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"
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

type RoleOption = { value: string; label: string }
type RolesResponse = { roles: RoleOption[] }
type OrgOption = { id: string; name: string }

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  /** Override organization name shown in the dialog description */
  orgName?: string
  /**
   * List of organizations to populate the org selector dropdown.
   * When omitted the dropdown shows only the caller's active Clerk org.
   */
  organizations?: OrgOption[]
  /**
   * Pre-select a specific organization (Supabase UUID).
   * Only meaningful when `organizations` is provided.
   */
  preSelectedOrgId?: string
  /**
   * When true the Organization dropdown is rendered as disabled / read-only.
   * Use for: row-action invites (always) and external active-org (always).
   */
  orgReadOnly?: boolean
}

/**
 * Shared invite-member dialog used by Settings Members and
 * Broker Organizations pages. Calls /api/brokers/invite-member
 * which stores the intended member role in pending_invite_roles.
 */
export function InviteMemberDialog({
  open,
  onOpenChange,
  onSuccess,
  orgName,
  organizations,
  preSelectedOrgId,
  orgReadOnly = false,
}: InviteMemberDialogProps) {
  const { organization } = useOrganization()

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

  const [selectedOrgId, setSelectedOrgId] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteOrgRole, setInviteOrgRole] = useState("org:member")
  const [inviteMemberRole, setInviteMemberRole] = useState("")
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  // Sync preSelectedOrgId when the dialog opens or the prop changes.
  // When no organizations list is provided, auto-select the active org
  // (the "__active__" sentinel). When a preSelectedOrgId is given, use it.
  // Otherwise, reset to empty so stale state doesn't carry over.
  useEffect(() => {
    if (open) {
      if (preSelectedOrgId) {
        setSelectedOrgId(preSelectedOrgId)
      } else if (!organizations && organization) {
        setSelectedOrgId("__active__")
      } else {
        setSelectedOrgId("")
      }
    }
  }, [open, preSelectedOrgId, organizations, organization])

  // Build dropdown options: use provided list, or fall back to a single
  // entry representing the caller's active Clerk org.
  const dropdownOptions: OrgOption[] =
    organizations && organizations.length > 0
      ? organizations
      : organization
        ? [{ id: "__active__", name: organization.name }]
        : []

  // Resolve the display org: from dropdown selection, orgName prop, or active org
  const selectedOrg = dropdownOptions.find((o) => o.id === selectedOrgId)
  const displayName =
    selectedOrg?.name ??
    orgName ??
    organization?.name ??
    "your organization"

  // Whether the dropdown is effectively read-only: explicit prop, or
  // when there is no organizations list (Settings page / single-org mode).
  const isOrgLocked = orgReadOnly || !organizations

  // Determine if a valid org is selected
  const hasOrgSelection =
    selectedOrgId.length > 0 || !organizations // when no list, active org is implicit

  const resetForm = () => {
    setInviteEmail("")
    setInviteOrgRole("org:member")
    setInviteMemberRole("")
    setInviteError(null)
    if (preSelectedOrgId) {
      setSelectedOrgId(preSelectedOrgId)
    } else if (!organizations && organization) {
      setSelectedOrgId("__active__")
    } else {
      setSelectedOrgId("")
    }
  }

  const handleInvite = async () => {
    if (organizations && !selectedOrgId) {
      setInviteError("Please select an organization")
      return
    }
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    setInviteError(null)
    try {
      const payload: Record<string, string> = {
        emailAddress: inviteEmail,
        orgRole: inviteOrgRole,
        memberRole: inviteMemberRole,
      }
      // Pass targetOrgId when an explicit org is selected from the list
      // (skip the special "__active__" sentinel used for single-org mode)
      if (selectedOrgId && selectedOrgId !== "__active__") {
        payload.targetOrgId = selectedOrgId
      }

      const res = await fetch("/api/brokers/invite-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to send invitation")
      }
      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error("Failed to invite member:", error)
      setInviteError(error?.message ?? "Failed to send invitation")
    } finally {
      setIsInviting(false)
    }
  }

  const canSubmit =
    inviteEmail.trim().length > 0 &&
    inviteMemberRole.length > 0 &&
    hasOrgSelection

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (!nextOpen) resetForm()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a new member</DialogTitle>
          <DialogDescription>
            Send an invitation to join {displayName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Organization selector -- always visible */}
          <div className="space-y-2">
            <Label htmlFor="invite-org">Organization</Label>
            <Select
              value={selectedOrgId}
              onValueChange={setSelectedOrgId}
              disabled={isOrgLocked}
            >
              <SelectTrigger id="invite-org">
                <SelectValue placeholder="Select an organization" />
              </SelectTrigger>
              <SelectContent>
                {dropdownOptions.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Select value={inviteOrgRole} onValueChange={setInviteOrgRole}>
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
          </div>
          {inviteError && (
            <p className="text-destructive text-sm">{inviteError}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={isInviting || !canSubmit}
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
  )
}
