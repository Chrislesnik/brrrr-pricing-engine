"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import dynamic from "next/dynamic"
const NavGroupClient = dynamic(() => import("@/components/layout/nav-group").then(m => ({ default: m.NavGroup })), {
  // Avoid server-rendering to prevent Radix/ID hydration mismatches in nested Collapsible/Trigger
  ssr: false,
})
const UserButtonClient = dynamic(() => import("@clerk/nextjs").then(m => ({ default: m.UserButton })), {
  // Avoid SSR to prevent hydration mismatch from Clerk's client-only rendering
  ssr: false,
})
import { OrganizationSwitcherIfEnabled } from "@/components/clerk/organization-switcher"
import { TeamSwitcher } from "@/components/layout/team-switcher"
import { sidebarData } from "./data/sidebar-data"
import { useEffect, useState } from "react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const update = () => setIsDark(root.classList.contains("dark"))
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative">
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          {/* Show Clerk orgs when enabled; otherwise fallback to static team switcher */}
          {/* No afterSelectOrganizationUrl - OrgChangeRefresher handles soft refresh */}
          <OrganizationSwitcherIfEnabled
            afterCreateOrganizationUrl="/pipeline"
            afterLeaveOrganizationUrl="/sign-in"
            appearance={{
              elements: {
                // Hide branding footer in the org switcher popover
                organizationSwitcherPopoverFooter: { display: "none" },
                organizationSwitcherTrigger:
                  `w-full h-12 justify-start gap-3 rounded-md px-3 py-3 text-base hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                   group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0
                   ${isDark ? "text-white" : ""}`,
                organizationSwitcherTriggerIcon: "hidden", // hide chevron/arrow
                organizationPreviewMainIdentifier: `text-base font-semibold group-data-[collapsible=icon]:sr-only ${isDark ? "text-white" : ""}`,
                organizationPreviewSecondaryIdentifier:
                  `text-sm group-data-[collapsible=icon]:sr-only ${isDark ? "text-white/90" : "text-muted-foreground"}`,
                organizationPreviewAvatarBox:
                  "group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6",
                organizationSwitcherPopoverCard:
                  `w-[--radix-popover-trigger-width] max-w-none ${isDark ? "text-white" : ""}`,
              },
            }}
          />
          {process.env.NEXT_PUBLIC_CLERK_ENABLE_ORGS !== "true" && (
            <TeamSwitcher teams={sidebarData.teams} />
          )}
        </SidebarHeader>
        <SidebarContent>
          {sidebarData.navGroups.map((props) => (
            <NavGroupClient key={props.title} {...props} />
          ))}
        </SidebarContent>
        <SidebarFooter>
          <div>
            <UserButtonClient
              afterSignOutUrl="/sign-in"
              showName
              appearance={{
                elements: {
                  // Hide "Secured by Clerk" watermark/footer in the user menu (Pro plan allows this)
                  userButtonPopoverFooter: { display: "none" },
                  userButtonTrigger:
                    `w-full flex flex-row items-center justify-start gap-3 rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                     group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0
                     ${isDark ? "text-white" : ""}`,
                  avatarBox: "order-first h-9 w-9 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6",
                  userButtonText: `order-last text-base font-medium group-data-[collapsible=icon]:sr-only ${isDark ? "text-white" : ""}`,
                  userButtonOuterIdentifier:
                    "group-data-[collapsible=icon]:hidden", // hide the name when collapsed
                  userButtonPopoverCard:
                    `w-[--radix-popover-trigger-width] max-w-none pl-3 pb-2 ${isDark ? "text-white" : ""}`,
                },
              }}
            />
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </div>
  )
}
