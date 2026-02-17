"use client"

import useSWR from "swr"
import { useAuth } from "@clerk/nextjs"

/**
 * Describes a single policy check: { resourceType, resourceName, action }.
 * The key is "resourceType:resourceName:action".
 */
export interface PolicyCheckQuery {
  resourceType: string
  resourceName: string
  action: string
}

/**
 * Builds a stable cache key from an array of policy check queries.
 * Returns null when there's nothing to check (prevents SWR from firing).
 */
function buildKey(
  orgId: string | null | undefined,
  checks: PolicyCheckQuery[],
): string | null {
  if (!orgId || !checks.length) return null
  const sorted = [...checks]
    .map((c) => `${c.resourceType}:${c.resourceName}:${c.action}`)
    .sort()
    .join(",")
  return `policy-check:${orgId}:${sorted}`
}

async function fetcher(
  _key: string,
  checks: PolicyCheckQuery[],
): Promise<Record<string, boolean>> {
  const res = await fetch("/api/policy/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checks }),
  })
  if (!res.ok) return {}
  const data = (await res.json()) as { results: Record<string, boolean> }
  return data.results ?? {}
}

/**
 * Hook to check one or more policy-engine permissions.
 *
 * Usage:
 *   const { allowed, isLoading } = usePolicyCheck([
 *     { resourceType: "feature", resourceName: "organization_invitations", action: "view" },
 *   ])
 *   const canViewBrokers = allowed["feature:organization_invitations:view"]
 */
export function usePolicyCheck(checks: PolicyCheckQuery[]) {
  const { orgId, isLoaded } = useAuth()

  const key = isLoaded ? buildKey(orgId, checks) : null

  const { data, isLoading, error } = useSWR(
    key,
    (k: string) => fetcher(k, checks),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    },
  )

  return {
    /** Map of "resourceType:resourceName:action" -> boolean */
    allowed: data ?? {},
    isLoading: !isLoaded || isLoading,
    error,
  }
}

/**
 * Convenience: check a single policy and return a boolean.
 */
export function useSinglePolicyCheck(
  resourceType: string,
  resourceName: string,
  action: string,
) {
  const key = `${resourceType}:${resourceName}:${action}`
  const { allowed, isLoading, error } = usePolicyCheck([
    { resourceType, resourceName, action },
  ])
  return {
    allowed: !!allowed[key],
    isLoading,
    error,
  }
}
