"use client"

import { useAuth, useOrganization } from "@clerk/nextjs"
import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export function OrgChangeRefresher() {
  const { orgId, getToken } = useAuth()
  const { organization } = useOrganization()
  const router = useRouter()
  const prevRef = useRef<string | null>(null)

  useEffect(() => {
    const active = organization?.id ?? orgId ?? null
    if (prevRef.current === null) {
      prevRef.current = active
      // #region agent log
      fetch('/api/_debug-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'org-change-refresher.tsx:init',message:'OrgChangeRefresher initial org',data:{orgId, organizationId: organization?.id}})}).catch(()=>{})
      // #endregion
      return
    }
    if (prevRef.current !== active) {
      // #region agent log
      fetch('/api/_debug-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'org-change-refresher.tsx:change',message:'OrgChangeRefresher detected org change',data:{from:prevRef.current,to:active}})}).catch(()=>{})
      // #endregion
      prevRef.current = active
      ;(async () => {
        try {
          await getToken?.({ skipCache: true } as any)
        } catch {}
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href)
          url.searchParams.delete("_org")
          url.searchParams.set("_org", `${active ?? "none"}:${Date.now()}`)
          router.replace(`${url.pathname}${url.search}`)
        }
        router.refresh()
      })()
    }
  }, [orgId, organization?.id, router, getToken])

  return null
}


