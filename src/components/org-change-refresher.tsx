"use client"

import { useAuth, useOrganization } from "@clerk/nextjs"
import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export function OrgChangeRefresher() {
  const { orgId, getToken } = useAuth()
  const { organization } = useOrganization()
  const router = useRouter()
  const prevRef = useRef<string | null>(null)
  const lastHandledRef = useRef<string | null>(null)

  useEffect(() => {
    const next = organization?.id ?? orgId ?? null
    const prev = prevRef.current

    if (prev === null) {
      prevRef.current = next
      // Log initial mount state
      fetch('/api/_debug-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'org-switch',
          hypothesisId: 'H1',
          location: 'org-change-refresher.tsx:init',
          message: 'Initial org state',
          data: { orgId, organizationId: organization?.id }
        })
      }).catch(() => {})
      return
    }

    // Ignore transient null during Clerk switching; act only on stable non-null changes
    if (next && next !== prev && lastHandledRef.value !== next) {
      prevRef.current = next
      lastHandledRef.current = next

      // Log about to refresh
      fetch('/api/_debug-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'org-switch',
          hypothesisId: 'H2',
          location: 'org-change-refresher.tsx:before-refresh',
          message: 'Org changed; will refresh',
          data: { from: prev, to: next }
        })
      }).catch(() => {})

      ;(async () => {
        try {
          await getToken?.({ skipCache: true } as any)
        } catch {}
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href)
          url.searchParams.delete("_org")
          url.searchParams.set("_org", `${next}:${Date.now()}`)
          const newUrl = `${url.pathname}${url.search}`
          await router.replace(newUrl)
        }
        router.refresh()
        // Log after refresh trigger
        fetch('/api/_debug-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'org-switch',
            hypothesisId: 'H3',
            location: 'org-change-refresher.tsx:after-refresh',
            message: 'Refresh triggered',
            data: { active: next }
          })
        }).catch(() => {})
      })()
    }
  }, [orgId, organization?.id, router, getToken])

  return null
}


