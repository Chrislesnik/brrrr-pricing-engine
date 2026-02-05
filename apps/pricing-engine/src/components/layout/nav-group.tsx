"use client"

import React, { ReactNode } from "react"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/shadcn/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@repo/ui/shadcn/sidebar"
import { Badge } from "../ui/badge"
import { NavItem, type NavGroup } from "./types"
import { useAuth } from "@clerk/nextjs"

export function NavGroup({ title, items }: NavGroup) {
  const { setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const { has, orgRole, isLoaded } = useAuth()
  const isOwner = orgRole === "org:owner" || orgRole === "owner"

  const [allowed, setAllowed] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    let active = true
    const keys = new Set<string>()
    items.forEach((item) => {
      if ("requiredPermission" in item && item.requiredPermission) {
        keys.add(item.requiredPermission)
      }
      if ("items" in item && item.items?.length) {
        item.items.forEach((sub) => {
          if (sub.requiredPermission) keys.add(sub.requiredPermission)
        })
      }
    })
    if (isOwner) {
      // Owners can see all items regardless of explicit permissions
      const next: Record<string, boolean> = {}
      Array.from(keys).forEach((k) => (next[k] = true))
      setAllowed(next)
    } else if (typeof has === "function" && isLoaded) {
      Promise.all(
        Array.from(keys).map(async (key) => ({
          key,
          ok: await has({ permission: key }),
        }))
      ).then((results) => {
        if (!active) return
        const next: Record<string, boolean> = {}
        results.forEach(({ key, ok }) => {
          next[key] = ok
        })
        setAllowed(next)
      })
    }
    return () => {
      active = false
    }
  }, [items, has, isOwner, isLoaded])

  const isVisible = (item: { requiredPermission?: string; denyOrgRoles?: string[]; allowOrgRoles?: string[] }) => {
    const bareRole = orgRole ? orgRole.replace(/^org:/, "") : undefined
    // Explicit allow list takes precedence (even for owners)
    if (item.allowOrgRoles && item.allowOrgRoles.length) {
      const allow =
        (!!orgRole && item.allowOrgRoles.includes(orgRole)) ||
        (!!bareRole && item.allowOrgRoles.includes(bareRole))
      return !!allow
    }
    if (isOwner) return true
    // Hide item if current org role is explicitly denied
    if (item.denyOrgRoles && item.denyOrgRoles.length && orgRole) {
      if (item.denyOrgRoles.includes(orgRole) || (bareRole ? item.denyOrgRoles.includes(bareRole) : false)) {
        return false
      }
    }
    if (!item.requiredPermission) return true
    return !!allowed[item.requiredPermission]
  }

  return (
    <SidebarGroup>
      {title !== "Settings" ? <SidebarGroupLabel>{title}</SidebarGroupLabel> : null}
      <SidebarMenu>
        {items.filter(isVisible).map((item) => {
          if (!item.items) {
            if (!item.url) return null
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={checkIsActive(pathname, item, true)}
                  tooltip={item.title}
                >
                  <Link href={item.url} onClick={() => setOpenMobile(false)}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && <NavBadge>{item.badge}</NavBadge>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }
          return (
            <Collapsible
              key={item.title}
              defaultOpen={checkIsActive(pathname, item, true)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                {item.url ? (
                  <div className="relative flex items-center gap-2">
                    <SidebarMenuButton
                      asChild
                      isActive={checkIsActive(pathname, item, true)}
                      tooltip={item.title}
                      className="flex-1"
                    >
                      <Link href={item.url} onClick={() => setOpenMobile(false)}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        {item.badge && <NavBadge>{item.badge}</NavBadge>}
                      </Link>
                    </SidebarMenuButton>
                    <CollapsibleTrigger asChild>
                      <button 
                        className="absolute right-1 p-1 rounded-sm hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden"
                        aria-label={`Toggle ${item.title} submenu`}
                      >
                        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </button>
                    </CollapsibleTrigger>
                  </div>
                ) : (
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      {item.badge && <NavBadge>{item.badge}</NavBadge>}
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                )}
                <CollapsibleContent className="CollapsibleContent">
                  <SidebarMenuSub>
                    {item.items.filter(isVisible).map((subItem) => {
                      const nestedItems = subItem.items?.filter(isVisible) ?? []
                      if (subItem.url) {
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={checkIsActive(pathname, subItem)}
                            >
                              <Link
                                href={subItem.url}
                                onClick={() => setOpenMobile(false)}
                              >
                                {subItem.icon && <subItem.icon />}
                                <span>{subItem.title}</span>
                                {subItem.badge && (
                                  <NavBadge>{subItem.badge}</NavBadge>
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      }
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <div className="flex items-center gap-2 px-2 py-1 text-sm">
                            {subItem.icon && <subItem.icon className="h-4 w-4" />}
                            <span>{subItem.title}</span>
                            {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                          </div>
                          {nestedItems.length > 0 ? (
                            <ul className="mt-1 space-y-1 pl-4">
                              {nestedItems.map((child) =>
                                child.url ? (
                                  <SidebarMenuSubItem key={`${subItem.title}-${child.title}`}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={checkIsActive(pathname, child)}
                                    >
                                      <Link
                                        href={child.url}
                                        onClick={() => setOpenMobile(false)}
                                      >
                                        {/* Icons removed for deeply nested items (3rd level) */}
                                        <span>{child.title}</span>
                                        {child.badge && <NavBadge>{child.badge}</NavBadge>}
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ) : null
                              )}
                            </ul>
                          ) : null}
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

const NavBadge = ({ children }: { children: ReactNode }) => (
  <Badge className="rounded-full px-1 py-0 text-xs">{children}</Badge>
)

function checkIsActive(href: string, item: NavItem, mainNav = false) {
  return (
    href === item.url || // /endpint?search=param
    href.split("?")[0] === item.url || // endpoint
    !!item?.items?.filter((i) => i.url === href).length || // if child nav is active
    (mainNav &&
      href.split("/")[1] !== "" &&
      href.split("/")[1] === item?.url?.split("/")[1])
  )
}
