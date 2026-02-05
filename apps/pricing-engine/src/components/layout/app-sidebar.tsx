"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@repo/ui/shadcn/sidebar";
import { useAuth, useUser } from "@clerk/nextjs";
import { NAVIGATION_CONFIG } from "@/app/(pricing-engine)/config/navigation";
import type { NavItem } from "@/app/(pricing-engine)/config/navigation";
import { NavUser } from "@/components/layout/nav-user";
import { TeamSwitcherV2 } from "@/components/layout/team-switcher-v2";
import { WorkspaceSwitcher } from "@repo/ui/custom/workspace-switcher";
import { NavSearch } from "@/components/layout/nav-search";

const NavGroup = dynamic(
  () => import("@/components/layout/nav-group").then((m) => ({ default: m.NavGroup })),
  { ssr: false }
);

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { has, orgRole, isLoaded } = useAuth();
  const { user } = useUser();
  const isOwner = orgRole === "org:owner" || orgRole === "owner";
  
  const [allowed, setAllowed] = React.useState<Record<string, boolean>>({});

  // Pre-compute permission checks (same logic as AppCommandDialog)
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

  // Filter navigation items
  const filteredNav = React.useMemo(() => {
    // Deep filter function
    const filterItems = (items: NavItem[]): NavItem[] => {
      return items
        .filter(isVisible)
        .map(item => ({
          ...item,
          items: item.items ? filterItems(item.items) : undefined
        }));
    };
    return filterItems(NAVIGATION_CONFIG);
  }, [isVisible]);

  // Extract main group (assuming first group is Main)
  const mainItems = filteredNav[0]?.items || [];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcherV2 />
        <WorkspaceSwitcher />
        <NavSearch />
      </SidebarHeader>
      <SidebarContent>
        {filteredNav.map((group) => (
          <NavGroup 
            key={group.title} 
            title={group.title} 
            items={group.items as any || []} 
          />
        ))}
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <NavUser
            user={{
              name: user.fullName || user.username || "User",
              email: user.primaryEmailAddress?.emailAddress || "",
              avatar: user.imageUrl,
            }}
          />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
