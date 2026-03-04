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
import { useNavVisibility } from "@/hooks/use-nav-visibility"

export function CommandMenu() {
  const router = useRouter()
  const { setTheme } = useTheme()
  const { open, setOpen } = useSearch()

  const allItems = React.useMemo(
    () => sidebarData.navGroups.flatMap((g) => g.items),
    [],
  )
  const { isVisible } = useNavVisibility(allItems)

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
                if ("url" in navItem && isVisible(navItem)) {
                  const url = navItem.url
                  if (!url) return null
                  return (
                    <CommandItem
                      key={`${url}-${i}`}
                      value={navItem.title}
                      onSelect={() => {
                        runCommand(() => router.push(url))
                      }}
                    >
                      <div className="mr-2 flex h-4 w-4 items-center justify-center">
                        <IconArrowRightDashed className="text-muted-foreground/80 size-2" />
                      </div>
                      {navItem.title}
                    </CommandItem>
                  )
                }

                return navItem.items
                  ?.filter(isVisible)
                  .map((subItem, i) => {
                    const url = subItem.url
                    if (!url) return null
                    return (
                      <CommandItem
                        key={`${url}-${i}`}
                        value={subItem.title}
                        onSelect={() => {
                          runCommand(() => router.push(url))
                        }}
                      >
                        <div className="mr-2 flex h-4 w-4 items-center justify-center">
                          <IconArrowRightDashed className="text-muted-foreground/80 size-2" />
                        </div>
                        {subItem.title}
                      </CommandItem>
                    )
                  })
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
