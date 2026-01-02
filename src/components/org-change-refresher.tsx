"use client"

import { useAuth, useOrganization } from "@clerk/nextjs"
import { useEffect, useMemo, useRef } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

export function OrgChangeRefresher() {
  const { orgId, getToken } = useAuth()
  const { organization } = useOrganization()
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()
  const prevRef = useRef<string | null>(null)
  const here = useMemo(() => {
    const qs = new URLSearchParams(search as any)
    qs.delete("_org")
    return `${pathname}${qs.toString() ? `?${qs.toString()}` : ""}`
  }, [pathname, search])

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
      try { void getToken?.({ skipCookie: true, template: undefined, forceRefresh: true } as any) } catch {}
      const stamp = Date.now().toString()
      const nextQs = new URLSearchParams(search as any)
      nextQs.set("_org", `${active ?? "none"}:${stamp}`)
      const nextUrl = `${pathname}?${nextQs.toString()}`
      router.replace(nextUrl)
    }
  }, [orgId, organization?.id, router, getToken, here, pathname, search])

  return null
}


