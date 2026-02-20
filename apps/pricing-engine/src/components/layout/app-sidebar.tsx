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
import { useUser } from "@clerk/nextjs";
import { NAVIGATION_CONFIG } from "@/app/(pricing-engine)/config/navigation";
import type { NavItem } from "@/app/(pricing-engine)/config/navigation";
import { NavUser } from "@/components/layout/nav-user";
import { TeamSwitcherV2 } from "@/components/layout/team-switcher-v2";
import { WorkspaceSwitcher } from "@repo/ui/custom/workspace-switcher";
import { NavSearch } from "@/components/layout/nav-search";
import { useNavVisibility } from "@/hooks/use-nav-visibility";

const NavGroup = dynamic(
  () => import("@/components/layout/nav-group").then((m) => ({ default: m.NavGroup })),
  { ssr: false }
);

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const { isVisible } = useNavVisibility(NAVIGATION_CONFIG);
  
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Filter navigation items
  const filteredNav = React.useMemo(() => {
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

  return (
    <Sidebar collapsible="icon" className="border-none" {...props}>
      <SidebarHeader className="pt-3">
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
        {mounted && user && (
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
