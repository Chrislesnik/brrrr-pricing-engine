"use client"

import { OrganizationSwitcher } from "@clerk/nextjs"
import { usePathname, useSearchParams } from "next/navigation"

export default function OrganizationSwitcherInner(
  props: React.ComponentProps<typeof OrganizationSwitcher>
) {
  const pathname = usePathname()
  const search = useSearchParams()
  const here = `${pathname}${search?.toString() ? `?${search.toString()}` : ""}`
  const merged: React.ComponentProps<typeof OrganizationSwitcher> = {
    afterSelectOrganizationUrl: props.afterSelectOrganizationUrl ?? here,
    afterCreateOrganizationUrl: props.afterCreateOrganizationUrl ?? here,
    afterLeaveOrganizationUrl: props.afterLeaveOrganizationUrl,
    ...props,
  }
  return <OrganizationSwitcher {...merged} />
}


