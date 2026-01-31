"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@clerk/nextjs";
import {
  Building2,
  Settings,
  User,
  Palette,
  Globe,
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
import { pricingRoutes } from "@repo/lib/routes";

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
  const { has, orgRole, isLoaded } = useAuth();
  const isOwner = orgRole === "org:owner" || orgRole === "owner";
  
  const [allowed, setAllowed] = React.useState<Record<string, boolean>>({});

  // Pre-compute permission checks
  React.useEffect(() => {
    let active = true;
    const keys = new Set<string>();
    
    const collectPermissions = (items: NavItem[]) => {
      items.forEach(item => {
        if (item.requiredPermission) keys.add(item.requiredPermission);
        if (item.items) collectPermissions(item.items);
      });
    };
    collectPermissions(NAVIGATION_CONFIG);

    if (isOwner) {
      const next: Record<string, boolean> = {};
      Array.from(keys).forEach((k) => (next[k] = true));
      setAllowed(next);
    } else if (typeof has === "function" && isLoaded) {
      Promise.all(
        Array.from(keys).map(async (key) => ({
          key,
          ok: await has({ permission: key }),
        }))
      ).then((results) => {
        if (!active) return;
        const next: Record<string, boolean> = {};
        results.forEach(({ key, ok }) => {
          next[key] = ok;
        });
        setAllowed(next);
      });
    }
    return () => {
      active = false;
    };
  }, [has, isLoaded, isOwner]);

  const isVisible = React.useCallback(
    (item: NavItem) => {
      const bareRole = orgRole ? orgRole.replace(/^org:/, "") : undefined;
      
      // Explicit allow list takes precedence
      if (item.allowOrgRoles && item.allowOrgRoles.length) {
        const allow =
          (!!orgRole && item.allowOrgRoles.includes(orgRole)) ||
          (!!bareRole && item.allowOrgRoles.includes(bareRole));
        return !!allow;
      }
      
      if (isOwner) return true;
      
      // Hide item if current org role is explicitly denied
      if (item.denyOrgRoles && item.denyOrgRoles.length && orgRole) {
        if (
          item.denyOrgRoles.includes(orgRole) ||
          (bareRole ? item.denyOrgRoles.includes(bareRole) : false)
        ) {
          return false;
        }
      }
      
      if (!item.requiredPermission) return true;
      return !!allowed[item.requiredPermission];
    },
    [allowed, isOwner, orgRole]
  );

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
                router.push(pricingRoutes.settings.root());
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
