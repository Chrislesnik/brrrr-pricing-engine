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
      return
    }
    if (prevRef.current !== curr) {
      prevRef.current = curr
      router.refresh()
    }
  }, [orgId, router])

  return null
}


