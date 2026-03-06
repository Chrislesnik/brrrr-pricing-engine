import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { cn } from "@repo/lib/cn";
import { SidebarProvider, SidebarInset } from "@repo/ui/shadcn/sidebar";
import { DocsSidebar } from "@/components/layout/docs-sidebar";
import { DocsHeader } from "@/components/layout/docs-header";
import { SWRProvider } from "@/components/providers/swr-provider";
import { source } from "@/lib/source";
import type * as PageTree from "fumadocs-core/page-tree";

interface Props {
  children: ReactNode;
}

function buildSidebarTree(): PageTree.Node[] {
  const tree = source.getPageTree();
  const rootPages: PageTree.Node[] = [];
  const folders: PageTree.Node[] = [];

  for (const node of tree.children) {
    if (node.type === "page") {
      rootPages.push(node);
    } else {
      folders.push(node);
    }
  }

  const result: PageTree.Node[] = [];

  if (rootPages.length > 0) {
    result.push({
      type: "folder",
      name: "Get Started",
      children: rootPages,
    } as PageTree.Folder);
  }

  result.push(...folders);

  // Append API Reference link to the Reference folder, or as a standalone
  const refFolder = result.find(
    (n) => n.type === "folder" && n.name === "Reference"
  ) as PageTree.Folder | undefined;

  const apiRefItem: PageTree.Item = {
    type: "page",
    name: "API Reference",
    url: "/docs/api-reference",
  };

  if (refFolder) {
    refFolder.children = [apiRefItem, ...refFolder.children];
  } else {
    result.push({
      type: "folder",
      name: "Reference",
      children: [apiRefItem],
    } as PageTree.Folder);
  }

  return result;
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
