"use client"

import React, { ReactNode } from "react"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
} from "@/components/ui/sidebar"
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

  const isVisible = (item: { requiredPermission?: string }) => {
    if (isOwner) return true
    if (!item.requiredPermission) return true
    return !!allowed[item.requiredPermission]
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.filter(isVisible).map((item) => {
          if (!item.items) {
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
              asChild
              defaultOpen={checkIsActive(pathname, item, true)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && <NavBadge>{item.badge}</NavBadge>}
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="CollapsibleContent">
                  <SidebarMenuSub>
                    {item.items.filter(isVisible).map((subItem) => (
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
                    ))}
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
