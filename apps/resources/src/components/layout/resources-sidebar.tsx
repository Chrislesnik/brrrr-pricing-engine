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
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@repo/ui/shadcn/sidebar";
import { useUser } from "@clerk/nextjs";
import { WorkspaceSwitcher } from "@repo/ui/custom/workspace-switcher";
import { TeamSwitcherV2 } from "./team-switcher-v2";
import { NavSearch } from "./nav-search";
import { NavUser } from "./nav-user";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles } from "lucide-react";
import { STATIC_NAV_SECTIONS } from "@/config/navigation";

export function ResourcesSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { user } = useUser();

  const renderStaticSections = () => {
    return STATIC_NAV_SECTIONS.map((section) => (
      <SidebarGroup key={section.id}>
        <SidebarGroupLabel className="gap-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
          <section.icon className="h-3.5 w-3.5" />
          {section.title}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {section.items.map((item, index) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              return (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    ));
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="pt-3">
        <TeamSwitcherV2 />
        <WorkspaceSwitcher />
        <NavSearch />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/resources"}
                  tooltip="Resource Hub"
                >
                  <Link href="/resources">
                    <Home className="h-4 w-4" />
                    <span>Resource Hub</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/resources/whats-new"}
                  tooltip="What's New"
                >
                  <Link href="/resources/whats-new">
                    <Sparkles className="h-4 w-4" />
                    <span>What&apos;s New</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-3" />

        {renderStaticSections()}
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
