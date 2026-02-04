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
} from "@repo/ui/shadcn/sidebar";
import { useUser } from "@clerk/nextjs";
import { WorkspaceSwitcher } from "@repo/ui/custom/workspace-switcher";
import { TeamSwitcherV2 } from "./team-switcher-v2";
import { NavSearch } from "./nav-search";
import { NavUser } from "./nav-user";
import type * as PageTree from "fumadocs-core/page-tree";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@repo/ui/shadcn/collapsible";

interface ResourcesSidebarProps extends React.ComponentProps<typeof Sidebar> {
  tree: PageTree.Node[];
}

export function ResourcesSidebar({ tree, ...props }: ResourcesSidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();

  // Recursive function to check if any descendant is active
  const hasActiveDescendant = (node: PageTree.Node): boolean => {
    if (node.type === "page") return pathname === node.url;
    if (node.type === "folder" && node.children) {
      return node.children.some(hasActiveDescendant);
    }
    return false;
  };

  // Recursive rendering function for nested items
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
            <Collapsible defaultOpen={hasActive} className="group/collapsible">
              <CollapsibleTrigger asChild>
                <SidebarMenuSubButton>
                  {child.index && (
                    <Link href={child.index.url} className="flex-1">
                      <span>{child.name}</span>
                    </Link>
                  )}
                  {!child.index && <span>{child.name}</span>}
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

  const renderNode = (node: PageTree.Node, index: number) => {
    const tooltipLabel = typeof node.name === "string" ? node.name : undefined;
    if (node.type === "page") {
      const isActive = pathname === node.url;
      return (
        <SidebarMenuItem key={index}>
          <SidebarMenuButton asChild isActive={isActive} tooltip={tooltipLabel}>
            <Link href={node.url}>
              <BookOpen className="h-4 w-4" />
              <span>{node.name}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    if (node.type === "folder") {
      const hasActive = hasActiveDescendant(node);

      return (
        <Collapsible key={index} defaultOpen={hasActive} className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={tooltipLabel}>
                <BookOpen className="h-4 w-4" />
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
      return <SidebarGroupLabel key={index}>{node.name}</SidebarGroupLabel>;
    }

    return null;
  };

  // Group nodes by category (folders at top level are categories)
  const renderGroupedContent = () => {
    const groups: { title?: string; indexUrl?: string; nodes: PageTree.Node[] }[] = [];
    let rootNodes: PageTree.Node[] = [];

    for (const node of tree) {
      if (node.type === "folder") {
        const title = typeof node.name === "string" ? node.name : undefined;
        // Each folder becomes its own group - render children directly
        groups.push({ 
          title,
          indexUrl: node.index?.url,
          nodes: node.children || [] 
        });
      } else {
        // Root level pages go together
        rootNodes.push(node);
      }
    }

    // Add root nodes as first group if they exist
    if (rootNodes.length > 0) {
      groups.unshift({ nodes: rootNodes });
    }

    return groups.map((group, groupIndex) => (
      <SidebarGroup key={groupIndex} className="px-0">
        {group.title && (
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
            {group.indexUrl ? (
              <Link href={group.indexUrl} className="hover:text-sidebar-foreground transition-colors">
                {group.title}
              </Link>
            ) : (
              group.title
            )}
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            {group.nodes.map((node, index) => renderNode(node, index))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    ));
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcherV2 />
        <WorkspaceSwitcher />
        <NavSearch />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {renderGroupedContent()}
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
