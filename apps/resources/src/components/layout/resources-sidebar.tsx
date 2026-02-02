"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@repo/ui/shadcn/sidebar";
import { useUser } from "@clerk/nextjs";
import { RESOURCES_NAV_ITEMS } from "@/config/navigation";
import { WorkspaceSwitcher } from "@repo/ui/custom/workspace-switcher";
import { NavUser } from "./nav-user";
import { NavMain } from "./nav-main";
import { TeamSwitcherV2 } from "./team-switcher-v2";
import { NavSearch } from "./nav-search";

export function ResourcesSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcherV2 />
        <WorkspaceSwitcher />
        <NavSearch />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={RESOURCES_NAV_ITEMS} />
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
