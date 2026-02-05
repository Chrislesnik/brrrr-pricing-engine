"use client"

import * as React from "react"
import { SWRConfig } from "swr"
import { OrgChangeRefresher } from "@/components/clerk/org-change-refresher"

interface SWRProviderProps {
  children: React.ReactNode
}

export function SWRProvider({ children }: SWRProviderProps): React.JSX.Element {
  return (
    <SWRConfig
      value={{
        // Short deduping to allow frequent revalidation
        dedupingInterval: 10 * 1000, // 10 seconds
        // Revalidate when user returns to browser tab
        revalidateOnFocus: true,
        // Revalidate when network reconnects
        revalidateOnReconnect: true,
        // Always revalidate on mount to check for fresh data
        revalidateOnMount: true,
        // Show previous data while revalidating (instant UI)
        keepPreviousData: true,
        // Retry failed requests
        errorRetryCount: 2,
        // Focus throttle - don't spam revalidations
        focusThrottleInterval: 5000, // 5 seconds between focus revalidations
        // Global fetcher
        fetcher: (url: string) => fetch(url).then((res) => res.json()),
      }}
    >
      <>
        {/* Refresh SWR cache on org change without navigation */}
        <OrgChangeRefresher />
        {children}
      </>
    </SWRConfig>
  )
}
