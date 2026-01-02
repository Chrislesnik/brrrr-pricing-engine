"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { OrganizationSwitcher, useOrganization } from "@clerk/nextjs"

export default function RefreshingOrganizationSwitcher(
  props: React.ComponentProps<typeof OrganizationSwitcher>
) {
  const router = useRouter()
  const { organization, isLoaded } = useOrganization()
  const previousId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (!isLoaded) return
    const currentId = organization?.id ?? null
    if (previousId.current === undefined) {
      previousId.current = currentId
      return
    }
    if (previousId.current !== currentId) {
      previousId.current = currentId
      router.refresh()
    }
  }, [organization?.id, isLoaded, router])

  return <OrganizationSwitcher {...props} />
}


