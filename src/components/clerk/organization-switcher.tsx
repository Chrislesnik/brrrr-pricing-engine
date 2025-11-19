"use client"

import dynamic from "next/dynamic"
import * as React from "react"

// Load the actual Clerk organization switcher only on the client.
const OrgInner = dynamic(() => import("./organization-switcher.inner"), {
  ssr: false,
})

type Props = Record<string, unknown>

export function OrganizationSwitcherIfEnabled(props: Props) {
  // Guard: only render when explicitly enabled to avoid dev crashes when
  // Clerk Organizations feature is turned off.
  if (process.env.NEXT_PUBLIC_CLERK_ENABLE_ORGS !== "true") {
    return null
  }
  // Render the real component
  // @ts-expect-error dynamic component
  return <OrgInner {...props} />
}


