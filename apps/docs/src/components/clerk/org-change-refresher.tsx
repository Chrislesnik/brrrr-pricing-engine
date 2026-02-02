"use client"

import { useOrganization } from "@clerk/nextjs"
import { useEffect, useRef } from "react"
import { useSWRConfig } from "swr"

/**
 * Component that listens for Clerk organization changes and triggers a soft refresh
 * of SWR-cached data without causing a full page navigation/reload.
 * This preserves client-side state like pagination, filters, and expanded rows.
 */
export function OrgChangeRefresher() {
  const { organization } = useOrganization()
  const { mutate } = useSWRConfig()
  const prevOrgId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    // Skip the initial mount - only respond to actual changes
    if (prevOrgId.current === undefined) {
      prevOrgId.current = organization?.id ?? null
      return
    }

    const currentOrgId = organization?.id ?? null

    // Only trigger refresh if org actually changed
    if (prevOrgId.current !== currentOrgId) {
      prevOrgId.current = currentOrgId

      // Revalidate all SWR keys to fetch fresh data for the new org
      // This is a soft refresh - components stay mounted, preserving local state
      mutate(
        // Match all keys (revalidate everything)
        () => true,
        // Don't pass new data, just revalidate
        undefined,
        // Options
        { revalidate: true }
      )
    }
  }, [organization?.id, mutate])

  // This component renders nothing
  return null
}
