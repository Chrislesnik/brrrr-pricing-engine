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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
} from "@repo/ui/shadcn/sidebar";
import { useUser } from "@clerk/nextjs";
import { WorkspaceSwitcher } from "@repo/ui/custom/workspace-switcher";
import { TeamSwitcherV2 } from "./team-switcher-v2";
import { NavSearch } from "./nav-search";
import { NavUser } from "./nav-user";
import type * as PageTree from "fumadocs-core/page-tree";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home, Sparkles } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/shadcn/collapsible";
import {
  CATEGORY_CONFIG,
  DEFAULT_CATEGORY_ICON,
  STATIC_NAV_SECTIONS,
} from "@/config/navigation";

interface ResourcesSidebarProps extends React.ComponentProps<typeof Sidebar> {
  tree: PageTree.Node[];
}

export function ResourcesSidebar({ tree, ...props }: ResourcesSidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();

  const hasActiveDescendant = (node: PageTree.Node): boolean => {
    if (node.type === "page") return pathname === node.url;
    if (node.type === "folder" && node.children) {
      return node.children.some(hasActiveDescendant);
    }
    return false;
  };

  const renderChildren = (children: PageTree.Node[]) => {
    return children.map((child, childIndex) => {
      if (child.type === "page") {
        const isActive = pathname === child.url;
        return (
          <SidebarMenuSubItem key={childIndex}>
            <SidebarMenuSubButton asChild isActive={isActive}>
              <Link href={child.url}>
                <span>{child.name}</span>
              </Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        );
      }

      if (child.type === "folder") {
        const hasActive = hasActiveDescendant(child);
        return (
          <SidebarMenuSubItem key={childIndex}>
            <Collapsible
              defaultOpen={hasActive}
              className="group/collapsible"
            >
              <CollapsibleTrigger asChild>
                <SidebarMenuSubButton>
                  {child.index ? (
                    <Link href={child.index.url} className="flex-1">
                      <span>{child.name}</span>
                    </Link>
                  ) : (
                    <span>{child.name}</span>
                  )}
                  <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuSubButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {child.children && renderChildren(child.children)}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuSubItem>
        );
      }

      return null;
    });
  };

  const renderNode = (
    node: PageTree.Node,
    index: number,
    showIcon: boolean = false
  ) => {
    const tooltipLabel =
      typeof node.name === "string" ? node.name : undefined;

    if (node.type === "page") {
      const isActive = pathname === node.url;
      return (
        <SidebarMenuItem key={index}>
          <SidebarMenuButton asChild isActive={isActive} tooltip={tooltipLabel}>
            <Link href={node.url}>
              <span>{node.name}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    if (node.type === "folder") {
      const hasActive = hasActiveDescendant(node);

      return (
        <Collapsible
          key={index}
          defaultOpen={hasActive}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={tooltipLabel}>
                {node.index ? (
                  <Link href={node.index.url} className="flex-1">
                    <span>{node.name}</span>
                  </Link>
                ) : (
                  <span>{node.name}</span>
                )}
                <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {node.children && renderChildren(node.children)}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    if (node.type === "separator") {
      return (
        <SidebarGroupLabel key={index}>{node.name}</SidebarGroupLabel>
      );
    }

    return null;
  };

  const renderBaseHubContent = () => {
    const categoryGroups: Record<string, PageTree.Node[]> = {};
    const rootNodes: PageTree.Node[] = [];

    for (const node of tree) {
      if (node.type === "folder") {
        const title = typeof node.name === "string" ? node.name : "Other";
        categoryGroups[title] = node.children || [];
      } else {
        rootNodes.push(node);
      }
    }

    const sortedCategories = Object.entries(categoryGroups).sort(
      ([a], [b]) => {
        const orderA = CATEGORY_CONFIG[a]?.order ?? 99;
        const orderB = CATEGORY_CONFIG[b]?.order ?? 99;
        return orderA - orderB;
      }
    );

    return (
      <>
        {rootNodes.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {rootNodes.map((node, index) => renderNode(node, index))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {sortedCategories.map(([category, nodes]) => {
          const config = CATEGORY_CONFIG[category];
          const Icon = config?.icon || DEFAULT_CATEGORY_ICON;

          return (
            <SidebarGroup key={category}>
              <SidebarGroupLabel className="gap-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
                <Icon className="h-3.5 w-3.5" />
                {config?.label || category}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {nodes.map((node, index) => renderNode(node, index))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </>
    );
  };

  const renderStaticSections = () => {
    return STATIC_NAV_SECTIONS.map((section) => {
      const hasActive = section.items.some(
        (item) => pathname === item.href || pathname.startsWith(item.href + "/")
      );

      return (
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
      );
    });
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="pt-3">
        <TeamSwitcherV2 />
        <WorkspaceSwitcher />
        <NavSearch />
      </SidebarHeader>

      <SidebarContent>
        {/* Pinned quick nav */}
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

        {/* BaseHub-driven content sections */}
        {renderBaseHubContent()}

        <SidebarSeparator className="mx-3" />

        {/* Static navigation sections */}
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
