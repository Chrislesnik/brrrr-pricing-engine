"use client";

import Link from "next/link";
import React from "react";
import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/shadcn/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    href?: string;
    url?: string;
    icon?: LucideIcon | React.ComponentType<{ className?: string }>;
    isActive?: boolean;
    items?: any[];
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
        Resources
      </SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const itemUrl = item.href || item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={item.isActive}
                  tooltip={item.title}
                >
                  {itemUrl ? (
                    <Link href={itemUrl}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  ) : (
                    <span>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
