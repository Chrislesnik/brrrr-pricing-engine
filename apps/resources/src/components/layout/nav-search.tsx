"use client";

import { Search } from "lucide-react";
import { SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@repo/ui/shadcn/sidebar";

export function NavSearch() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          className="text-sidebar-foreground/70"
          tooltip="Search documentation"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
