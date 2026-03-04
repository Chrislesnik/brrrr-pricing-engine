"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Building2,
  Settings,
  User,
  Laptop,
  Moon,
  Sun,
  ArrowRight,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@repo/ui/shadcn/command";

import { NAVIGATION_CONFIG, flattenNavigation, type NavItem } from "@/app/(pricing-engine)/config/navigation";
import { useNavVisibility } from "@/hooks/use-nav-visibility";

interface AppCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenTeamSwitcher?: () => void;
}

export function AppCommandDialog({
  open,
  onOpenChange,
  onOpenTeamSwitcher,
}: AppCommandDialogProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { isVisible } = useNavVisibility(NAVIGATION_CONFIG);

  const runCommand = React.useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange]
  );

  const flatNav = React.useMemo(() => flattenNavigation(NAVIGATION_CONFIG), []);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {flatNav.filter(isVisible).map((item) => {
            const Icon = item.icon || ArrowRight;
            return (
              <CommandItem
                key={item.url || item.title}
                onSelect={() => item.url && runCommand(() => router.push(item.url!))}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
                {item.shortcut && (
                  <CommandShortcut>{item.shortcut.join("")}</CommandShortcut>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
        
        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                // TODO: Add profile route
                console.log("Open user profile");
              })
            }
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                if (onOpenTeamSwitcher) {
                  onOpenTeamSwitcher();
                }
              })
            }
          >
            <Building2 className="mr-2 h-4 w-4" />
            <span>My Organizations</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                 router.push("/settings");
              })
            }
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />

        <CommandGroup heading="Preferences">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                setTheme("light");
              })
            }
          >
            <Sun className="mr-2 h-4 w-4" />
            <span>Light Theme</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                setTheme("dark");
              })
            }
          >
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark Theme</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                setTheme("system");
              })
            }
          >
            <Laptop className="mr-2 h-4 w-4" />
            <span>System Theme</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
