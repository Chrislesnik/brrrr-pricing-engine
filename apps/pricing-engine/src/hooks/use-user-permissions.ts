"use client"

import { useMemo } from "react"
import { useUser } from "@clerk/nextjs"
import type { ContactType, UserPermissions, UserRole } from "@/types/auth"

type HookState = {
  permissions: UserPermissions | null
  loading: boolean
  error: Error | null
}

export function useUserPermissions(): HookState {
  const { user, isLoaded, isSignedIn } = useUser()

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

    const role = (metadata.role ??
      user.organizationMemberships?.[0]?.role?.replace("org:", "") ??
      "member") as UserRole

    return {
      contactType,
      role,
      ...permissionFlags,
    }
  }, [isLoaded, isSignedIn, user])

  return {
    permissions,
    loading: !isLoaded,
    error: null,
  }
}
