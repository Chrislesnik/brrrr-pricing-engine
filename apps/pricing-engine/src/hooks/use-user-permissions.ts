"use client"

import { useMemo } from "react"
import { useUser, useAuth } from "@clerk/nextjs"
import type { ContactType, UserPermissions, UserRole } from "@/types/auth"

type HookState = {
  permissions: UserPermissions | null
  loading: boolean
  error: Error | null
}

export function useUserPermissions(): HookState {
  const { user, isLoaded, isSignedIn } = useUser()
  const { orgId } = useAuth()

  const permissions = useMemo<UserPermissions | null>(() => {
    if (!isLoaded || !isSignedIn || !user) return null

    const metadata = user.publicMetadata ?? {}
    const permissionFlags =
      typeof metadata.permissions === "object" && metadata.permissions
        ? (metadata.permissions as Record<string, boolean>)
        : {}

    const contactType = (metadata.contactType ??
      metadata.contact_type ??
      "Borrower") as ContactType

    const activeMembership = orgId
      ? user.organizationMemberships?.find(
          (m) => m.organization?.id === orgId,
        )
      : user.organizationMemberships?.[0]

    const membershipMeta = (activeMembership?.publicMetadata ?? {}) as Record<
      string,
      unknown
    >
    const orgMemberRole =
      typeof membershipMeta.org_member_role === "string"
        ? membershipMeta.org_member_role
        : null

    const role = (orgMemberRole ??
      activeMembership?.role?.replace("org:", "") ??
      "member") as UserRole

    return {
      contactType,
      role,
      ...permissionFlags,
    }
  }, [isLoaded, isSignedIn, user, orgId])

  return {
    permissions,
    loading: !isLoaded,
    error: null,
  }
}
