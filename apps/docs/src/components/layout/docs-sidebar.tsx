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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/shadcn/collapsible";
import { useUser } from "@clerk/nextjs";
import { WorkspaceSwitcher } from "@repo/ui/custom/workspace-switcher";
import { NavUser } from "./nav-user";
import { TeamSwitcherV2 } from "./team-switcher-v2";
import { NavSearch } from "./nav-search";
import type * as PageTree from "fumadocs-core/page-tree";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronRight, Folder } from "lucide-react";

interface DocsSidebarProps extends React.ComponentProps<typeof Sidebar> {
  tree: PageTree.Node[];
}

export function DocsSidebar({ tree, ...props }: DocsSidebarProps) {
  const { user } = useUser();
  const pathname = usePathname();

  const hasActivePath = (node: PageTree.Node): boolean => {
    if (node.type === "page") return pathname === node.url;
    if (node.type === "folder") return node.children.some(hasActivePath);
    return false;
  };

  const renderPage = (item: PageTree.Item, level: number) => {
    const isActive = pathname === item.url;
    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={isActive} style={{ paddingLeft: 8 + level * 12 }}>
          <Link href={item.url}>
            <BookOpen className="h-4 w-4" />
            <span>{item.name}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderFolderMenu = (folder: PageTree.Folder, level: number) => {
    const defaultOpen = folder.defaultOpen ?? hasActivePath(folder);
    return (
      <SidebarMenuItem key={`${folder.name}-${level}`}>
        <Collapsible defaultOpen={defaultOpen}>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton style={{ paddingLeft: 8 + level * 12 }}>
              <Folder className="h-4 w-4" />
              <span className="flex-1">{folder.name}</span>
              <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenu className="ml-3 border-l pl-2">
              {folder.children.map((child) =>
                child.type === "page"
                  ? renderPage(child, level + 1)
                  : child.type === "folder"
                    ? renderFolderMenu(child, level + 1)
                    : null
              )}
            </SidebarMenu>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    );
  };

  const topLevelFolders = tree.filter(
    (node): node is PageTree.Folder => node.type === "folder"
  );
  const topLevelPages = tree.filter(
    (node): node is PageTree.Item => node.type === "page"
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcherV2 />
        <WorkspaceSwitcher />
        <NavSearch />
      </SidebarHeader>
      <SidebarContent>
        {topLevelFolders.map((folder) => (
          <SidebarGroup key={`group-${folder.name}`}>
            <Collapsible defaultOpen={folder.defaultOpen ?? hasActivePath(folder)}>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center gap-2">
                  <span className="flex-1">{folder.name}</span>
                  <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {folder.children.map((child) =>
                      child.type === "page"
                        ? renderPage(child, 0)
                        : child.type === "folder"
                          ? renderFolderMenu(child, 0)
                          : null
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        ))}
        {topLevelPages.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Docs</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {topLevelPages.map((item) => renderPage(item, 0))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
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
