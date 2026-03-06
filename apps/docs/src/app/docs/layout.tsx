import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { cn } from "@repo/lib/cn";
import { SidebarProvider, SidebarInset } from "@repo/ui/shadcn/sidebar";
import { DocsSidebar } from "@/components/layout/docs-sidebar";
import { DocsHeader } from "@/components/layout/docs-header";
import { SWRProvider } from "@/components/providers/swr-provider";
import type * as PageTree from "fumadocs-core/page-tree";

interface Props {
  children: ReactNode;
}

function buildSidebarTree(): PageTree.Node[] {
  const items: PageTree.Node[] = [];

  items.push({
    type: "folder",
    name: "Overview",
    children: [
      { type: "page", name: "Getting Started", url: "/docs/getting-started" } as PageTree.Item,
      { type: "page", name: "Platform Overview", url: "/docs/platform-overview" } as PageTree.Item,
    ],
  } as PageTree.Folder);

  items.push({
    type: "folder",
    name: "Guides",
    children: [
      { type: "page", name: "Managing Deals", url: "/docs/guides/deals" } as PageTree.Item,
      { type: "page", name: "Borrowers & Entities", url: "/docs/guides/borrowers-entities" } as PageTree.Item,
      { type: "page", name: "Document Storage", url: "/docs/guides/documents" } as PageTree.Item,
      { type: "page", name: "AI Features", url: "/docs/power-users/ai-features" } as PageTree.Item,
    ],
  } as PageTree.Folder);

  items.push({
    type: "folder",
    name: "Policies & Permissions",
    children: [
      { type: "page", name: "Row-Level Security", url: "/docs/power-users/rls" } as PageTree.Item,
    ],
  } as PageTree.Folder);

  items.push({
    type: "folder",
    name: "Features",
    children: [
      { type: "page", name: "REST API", url: "/docs/power-users/api-integration" } as PageTree.Item,
      { type: "page", name: "SQL & Data Access", url: "/docs/power-users/sql-data-access" } as PageTree.Item,
    ],
  } as PageTree.Folder);

  items.push({
    type: "folder",
    name: "Reference",
    children: [
      { type: "page", name: "API Reference", url: "/docs/api-reference" } as PageTree.Item,
      { type: "page", name: "Database Schema", url: "/docs/reference/database-schema" } as PageTree.Item,
    ],
  } as PageTree.Folder);

  return items;
}

export default async function DocsLayout({ children }: Props) {
  const cookieStore = await cookies();
  const defaultClose = cookieStore.get("sidebar:state")?.value === "false";
  const tree = buildSidebarTree();

  return (
    <div className="border-grid flex flex-1 flex-col">
      <SWRProvider>
        <SidebarProvider defaultOpen={!defaultClose}>
          <DocsSidebar variant="inset" tree={tree} />
          <SidebarInset>
            <DocsHeader />
            <div
              id="content"
              className={cn(
                "flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto",
                "has-[div[data-layout=fixed]]:h-svh",
                "group-data-[scroll-locked=1]/body:h-full",
                "has-[data-layout=fixed]:group-data-[scroll-locked=1]/body:h-svh"
              )}
            >
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SWRProvider>
    </div>
  );
}
