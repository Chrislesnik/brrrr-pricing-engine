"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/shadcn/sidebar";
import { useUser } from "@clerk/nextjs";
import { WorkspaceSwitcher } from "@repo/ui/custom/workspace-switcher";
import { NavUser } from "./nav-user";
import { TeamSwitcherV2 } from "./team-switcher-v2";
import { NavSearch } from "./nav-search";
import type * as PageTree from "fumadocs-core/page-tree";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";

interface DocsSidebarProps extends React.ComponentProps<typeof Sidebar> {
  tree: PageTree.Node[];
}

export function DocsSidebar({ tree, ...props }: DocsSidebarProps) {
  const { user } = useUser();
  const pathname = usePathname();

  const groups: Array<{ title?: React.ReactNode; items: PageTree.Node[] }> = [];
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

  if (currentGroup.length > 0) {
    groups.push({ items: currentGroup });
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcherV2 />
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
