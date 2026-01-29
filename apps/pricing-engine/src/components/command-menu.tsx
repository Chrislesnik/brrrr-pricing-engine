"use client"

import * as React from "react"
import {
  IconArrowRightDashed,
  IconDeviceLaptop,
  IconMoon,
  IconSun,
} from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/ui/shadcn/command"
import { sidebarData } from "./layout/data/sidebar-data"
import { useSearch } from "./search-provider"
import { ScrollArea } from "./ui/scroll-area"
import { useAuth } from "@clerk/nextjs"

export function CommandMenu() {
  const router = useRouter()
  const { setTheme } = useTheme()
  const { open, setOpen } = useSearch()
  const { has, orgRole, isLoaded } = useAuth()
  const isOwner = orgRole === "org:owner" || orgRole === "owner"

  const [allowed, setAllowed] = React.useState<Record<string, boolean>>({})

  // Pre-compute permission checks for any items that require them
  React.useEffect(() => {
    let active = true
    const keys = new Set<string>()
    sidebarData.navGroups.forEach((group) => {
      group.items.forEach((item) => {
        if ("requiredPermission" in item && item.requiredPermission) {
          keys.add(item.requiredPermission)
        }
        if ("items" in item && item.items?.length) {
          item.items.forEach((sub) => {
            if (sub.requiredPermission) keys.add(sub.requiredPermission)
          })
        }
      })
    })
    if (isOwner) {
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
  }, [has, isLoaded, isOwner])

  const isVisible = React.useCallback(
    (item: { requiredPermission?: string; denyOrgRoles?: string[]; allowOrgRoles?: string[] }) => {
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
        if (
          item.denyOrgRoles.includes(orgRole) ||
          (bareRole ? item.denyOrgRoles.includes(bareRole) : false)
        ) {
          return false
        }
      }
      if (!item.requiredPermission) return true
      return !!allowed[item.requiredPermission]
    },
    [allowed, isOwner, orgRole]
  )

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <ScrollArea type="hover" className="h-72 pr-1">
          <CommandEmpty>No results found.</CommandEmpty>
          {sidebarData.navGroups.map((group) => (
            <CommandGroup key={group.title} heading={group.title}>
              {group.items.filter(isVisible).map((navItem, i) => {
                if ("url" in navItem && navItem.url && isVisible(navItem))
                  return (
                    <CommandItem
                      key={`${navItem.url}-${i}`}
                      value={navItem.title}
                      onSelect={() => {
                        runCommand(() => router.push(navItem.url))
                      }}
                    >
                      <div className="mr-2 flex h-4 w-4 items-center justify-center">
                        <IconArrowRightDashed className="text-muted-foreground/80 size-2" />
                      </div>
                      {navItem.title}
                    </CommandItem>
                  )

                return navItem.items
                  ?.filter(isVisible)
                  .map((subItem, i) => (
                    <CommandItem
                      key={`${subItem.url}-${i}`}
                      value={subItem.title}
                      onSelect={() => {
                        runCommand(() => router.push(subItem.url))
                      }}
                    >
                      <div className="mr-2 flex h-4 w-4 items-center justify-center">
                        <IconArrowRightDashed className="text-muted-foreground/80 size-2" />
                      </div>
                      {subItem.title}
                    </CommandItem>
                  ))
              })}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
              <IconSun /> <span>Light</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
              <IconMoon className="scale-90" />
              <span>Dark</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
              <IconDeviceLaptop />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  )
}
