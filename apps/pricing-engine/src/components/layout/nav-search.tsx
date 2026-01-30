"use client";

import { SearchForm } from "@/components/layout/search-form";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@repo/ui/shadcn/sidebar";

export function NavSearch() {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu className="w-full">
          <SidebarMenuItem className="flex items-center gap-2 w-full">
            <SearchForm variant="sidebar" className="w-full" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
