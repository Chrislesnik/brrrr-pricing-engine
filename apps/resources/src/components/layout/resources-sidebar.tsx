"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@repo/ui/shadcn/sidebar";
import { WorkspaceSwitcher } from "@repo/ui/custom/workspace-switcher";
import { NavSearch } from "./nav-search";
import type { PageTree } from "fumadocs-core/server";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";

interface ResourcesSidebarProps extends React.ComponentProps<typeof Sidebar> {
  tree: PageTree.Node[];
}

export function ResourcesSidebar({ tree, ...props }: ResourcesSidebarProps) {
  const pathname = usePathname();

  // Group items by separators
  const groups: Array<{ title?: string; items: PageTree.Node[] }> = [];
  let currentGroup: PageTree.Node[] = [];

  for (const node of tree) {
    if (node.type === "separator") {
      if (currentGroup.length > 0) {
        groups.push({ items: currentGroup });
        currentGroup = [];
      }
      groups.push({ title: node.name, items: [] });
    } else if (node.type === "page") {
      if (groups.length === 0) {
        currentGroup.push(node);
      } else {
        groups[groups.length - 1].items.push(node);
      }
    }
  }

  // Add remaining items
  if (currentGroup.length > 0) {
    groups.push({ items: currentGroup });
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
        <NavSearch />
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group, index) => (
          <SidebarGroup key={index}>
            {group.title && <SidebarGroupLabel>{group.title}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item, itemIndex) => {
                  if (item.type !== "page") return null;
                  const isActive = pathname === item.url;
                  
                  return (
                    <SidebarMenuItem key={itemIndex}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.url}>
                          <BookOpen className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
