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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/shadcn/tooltip"
import { Badge } from "../ui/badge"
import { NavItem, type NavGroup } from "./types"
import { useNavVisibility } from "@/hooks/use-nav-visibility"

export function NavGroup({ title, items }: NavGroup) {
  const { setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const { isVisible } = useNavVisibility(items)

  return (
    <SidebarGroup>
      {title !== "Settings" ? <SidebarGroupLabel>{title}</SidebarGroupLabel> : null}
      <SidebarMenu>
        {items.filter(isVisible).map((item) => {
          if (!item.items) {
            if (!item.url) return null
            const buttonContent = (
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
            )
            return (
              <SidebarMenuItem key={item.title}>
                {item.tooltip ? (
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {buttonContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" align="center" className="max-w-xs">
                        <p>{item.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  buttonContent
                )}
              </SidebarMenuItem>
            )
          }
          return (
            <SidebarMenuItem key={item.title}>
              <Collapsible
                defaultOpen={checkIsActive(pathname, item, true)}
                className="group/collapsible"
              >
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
                        const subButtonContent = (
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
                        )
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            {subItem.tooltip ? (
                              <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    {subButtonContent}
                                  </TooltipTrigger>
                                  <TooltipContent side="right" align="center" className="max-w-xs">
                                    <p>{subItem.tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              subButtonContent
                            )}
                          </SidebarMenuSubItem>
                        )
                      }
                      // Sub-item without URL: render as collapsible group if it has children,
                      // or a simple label if empty.
                      if (nestedItems.length > 0) {
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <Collapsible
                              defaultOpen={nestedItems.some((child) => checkIsActive(pathname, child))}
                              className="group/nested-collapsible"
                            >
                              <CollapsibleTrigger asChild>
                                <button className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                                  {subItem.icon && <subItem.icon className="h-4 w-4" />}
                                  <span>{subItem.title}</span>
                                  {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                                  <ChevronRight className="ml-auto h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/nested-collapsible:rotate-90" />
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <ul className="mt-1 space-y-1 pl-6">
                                  {nestedItems.map((child) => {
                                    if (!child.url) return null
                                    const childButtonContent = (
                                      <SidebarMenuSubButton
                                        asChild
                                        isActive={checkIsActive(pathname, child)}
                                      >
                                        <Link
                                          href={child.url}
                                          onClick={() => setOpenMobile(false)}
                                        >
                                          {child.icon && <child.icon />}
                                          <span>{child.title}</span>
                                          {child.badge && <NavBadge>{child.badge}</NavBadge>}
                                        </Link>
                                      </SidebarMenuSubButton>
                                    )
                                    return (
                                      <SidebarMenuSubItem key={`${subItem.title}-${child.title}`}>
                                        {child.tooltip ? (
                                          <TooltipProvider delayDuration={300}>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                {childButtonContent}
                                              </TooltipTrigger>
                                              <TooltipContent side="right" align="center" className="max-w-xs">
                                                <p>{child.tooltip}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        ) : (
                                          childButtonContent
                                        )}
                                      </SidebarMenuSubItem>
                                    )
                                  })}
                                </ul>
                              </CollapsibleContent>
                            </Collapsible>
                          </SidebarMenuSubItem>
                        )
                      }
                      // Empty stage label (no children)
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <div className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-sidebar-foreground/70">
                            {subItem.icon && <subItem.icon className="h-4 w-4" />}
                            <span>{subItem.title}</span>
                            {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                          </div>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>
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
  const cleanHref = href.split("?")[0]
  return (
    href === item.url || // /endpoint?search=param
    cleanHref === item.url || // endpoint
    !!item?.items?.filter((i) => i.url === href).length || // if child nav is active
    (mainNav &&
      !!item?.url &&
      cleanHref.startsWith(item.url + "/")) // only match if href is a true sub-path of item.url
  )
}
