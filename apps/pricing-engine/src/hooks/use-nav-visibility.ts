"use client"

import * as React from "react"
import { useAuth } from "@clerk/nextjs"
import { usePolicyCheck, type PolicyCheckQuery } from "./use-policy-check"

/**
 * Minimal shape needed for visibility checks.
 * Compatible with both navigation.ts NavItem and layout/types NavItem.
 */
interface VisibleItem {
  requiredPermission?: string
  denyOrgRoles?: string[]
  allowOrgRoles?: string[]
  policyCheck?: { resourceType: string; resourceName: string; action: string }
  items?: VisibleItem[]
}

/**
 * Collects all policyCheck configs from a nested item tree.
 */
function collectPolicyChecks(items: VisibleItem[]): PolicyCheckQuery[] {
  const map = new Map<string, PolicyCheckQuery>()
  const walk = (list: VisibleItem[]) => {
    for (const item of list) {
      if (item.policyCheck) {
        const key = `${item.policyCheck.resourceType}:${item.policyCheck.resourceName}:${item.policyCheck.action}`
        if (!map.has(key)) {
          map.set(key, {
            resourceType: item.policyCheck.resourceType,
            resourceName: item.policyCheck.resourceName,
            action: item.policyCheck.action,
          })
        }
      }
      if (item.items?.length) walk(item.items)
    }
  }
  walk(items)
  return Array.from(map.values())
}

/**
 * Collects all requiredPermission keys from a nested item tree.
 */
function collectPermissionKeys(items: VisibleItem[]): Set<string> {
  const keys = new Set<string>()
  const walk = (list: VisibleItem[]) => {
    for (const item of list) {
      if (item.requiredPermission) keys.add(item.requiredPermission)
      if (item.items?.length) walk(item.items)
    }
  }
  walk(items)
  return keys
}

/**
 * Shared hook for determining navigation item visibility.
 *
 * Consolidates Clerk permission checks, denyOrgRoles/allowOrgRoles filtering,
 * and policy-engine checks into a single hook used by the sidebar,
 * command palette, and nav groups.
 *
 * Priority order for each item:
 * 1. `policyCheck` (policy engine) – takes precedence when present
 * 2. `allowOrgRoles` – explicit allow list (even for owners)
 * 3. owner bypass – owners see everything not restricted by allowOrgRoles
 * 4. `denyOrgRoles` – explicit deny list
 * 5. `requiredPermission` – Clerk permission check
 */
export function useNavVisibility(items: VisibleItem[]) {
  const { has, orgRole, isLoaded } = useAuth()
  const isOwner = orgRole === "org:owner" || orgRole === "owner"

  // --- Policy-engine checks (batched, SWR-cached) ---
  const policyChecks = React.useMemo(() => collectPolicyChecks(items), [items])
  const { allowed: policyResults, isLoading: policyLoading } =
    usePolicyCheck(policyChecks)

  // --- Clerk permission checks ---
  const [clerkAllowed, setClerkAllowed] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    let active = true
    const keys = collectPermissionKeys(items)

    if (isOwner) {
      const next: Record<string, boolean> = {}
      keys.forEach((k) => (next[k] = true))
      setClerkAllowed(next)
    } else if (typeof has === "function" && isLoaded) {
      Promise.all(
        Array.from(keys).map(async (key) => ({
          key,
          ok: await has({ permission: key }),
        })),
      ).then((results) => {
        if (!active) return
        const next: Record<string, boolean> = {}
        results.forEach(({ key, ok }) => (next[key] = ok))
        setClerkAllowed(next)
      })
    }
    return () => {
      active = false
    }
  }, [items, has, isLoaded, isOwner])

  // --- Visibility function ---
  const isVisible = React.useCallback(
    (item: VisibleItem): boolean => {
      const bareRole = orgRole ? orgRole.replace(/^org:/, "") : undefined

      // 1. Policy check (when present)
      //    If the policy engine returns true -> show.
      //    If it returns false but the item also has legacy denyOrgRoles/allowOrgRoles,
      //    fall through so the item degrades gracefully when the DB migration
      //    hasn't been applied yet.
      if (item.policyCheck) {
        const key = `${item.policyCheck.resourceType}:${item.policyCheck.resourceName}:${item.policyCheck.action}`
        if (policyResults[key] === true) return true
        // Only hard-deny if no legacy fallback is configured
        const hasLegacyFallback = !!(item.denyOrgRoles?.length || item.allowOrgRoles?.length)
        if (!hasLegacyFallback) return false
        // Otherwise fall through to legacy checks below
      }

      // 2. Explicit allow list takes precedence (even for owners)
      if (item.allowOrgRoles?.length) {
        return (
          (!!orgRole && item.allowOrgRoles.includes(orgRole)) ||
          (!!bareRole && item.allowOrgRoles.includes(bareRole))
        )
      }

      // 3. Owner bypass
      if (isOwner) return true

      // 4. Deny list
      if (item.denyOrgRoles?.length && orgRole) {
        if (
          item.denyOrgRoles.includes(orgRole) ||
          (bareRole ? item.denyOrgRoles.includes(bareRole) : false)
        ) {
          return false
        }
      }

      // 5. Clerk permission
      if (!item.requiredPermission) return true
      return !!clerkAllowed[item.requiredPermission]
    },
    [policyResults, clerkAllowed, isOwner, orgRole],
  )

  return {
    isVisible,
    isLoading: !isLoaded || policyLoading,
  }
}
