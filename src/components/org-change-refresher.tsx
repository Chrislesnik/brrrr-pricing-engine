"use client"

import { useAuth } from "@clerk/nextjs"
import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export function OrgChangeRefresher() {
  const { orgId } = useAuth()
  const router = useRouter()
  const prevRef = useRef<string | null>(null)

  useEffect(() => {
    const curr = orgId ?? null
    if (prevRef.current === null) {
      prevRef.current = curr
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3a0e0fc4-bf2e-468f-ad62-2c613d6d0bdc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'org-change-refresher.tsx:init',message:'OrgChangeRefresher initial orgId',data:{orgId:curr},timestamp:Date.now()})}).catch(()=>{})
      fetch('/api/_debug-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'org-change-refresher.tsx:init',message:'OrgChangeRefresher initial orgId (proxy)',data:{orgId:curr}})}).catch(()=>{})
      // #endregion
      return
    }
    if (prevRef.current !== curr) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3a0e0fc4-bf2e-468f-ad62-2c613d6d0bdc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'org-change-refresher.tsx:change',message:'OrgChangeRefresher detected org change',data:{from:prevRef.current,to:curr},timestamp:Date.now()})}).catch(()=>{})
      fetch('/api/_debug-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'org-change-refresher.tsx:change',message:'OrgChangeRefresher detected org change (proxy)',data:{from:prevRef.current,to:curr}})}).catch(()=>{})
      // #endregion
      prevRef.current = curr
      router.refresh()
    }
  }, [orgId, router])

  return null
}


