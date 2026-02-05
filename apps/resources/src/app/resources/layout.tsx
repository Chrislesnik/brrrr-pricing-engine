import type { ReactNode } from 'react';
import { cookies, draftMode } from "next/headers";
import { cn } from "@repo/lib/cn";
import { SidebarProvider, SidebarInset } from "@repo/ui/shadcn/sidebar";
import { ResourcesSidebar } from "@/components/layout/resources-sidebar";
import { ResourcesHeader } from "@/components/layout/resources-header";
import { SWRProvider } from "@/components/providers/swr-provider";
import { Pump } from "basehub/react-pump";
import type * as PageTree from "fumadocs-core/page-tree";
import { DraftModeIndicator } from "@/components/draft-mode-indicator";
import { BaseHubToolbarWrapper } from "@/components/basehub-toolbar-wrapper";

interface Props {
  children: ReactNode;
}

export default async function ResourcesRouteLayout({ children }: Props) {
  const cookieStore = await cookies();
  const defaultClose = cookieStore.get("sidebar:state")?.value === "false";
  const { isEnabled } = await draftMode();
  
  return (
    <div className="border-grid flex flex-1 flex-col">
      <SWRProvider>
        <Pump
          draft={isEnabled}
          queries={[
            {
              documentation: {
                _searchKey: true,
                items: {
                  _id: true,
                  _title: true,
                  _slug: true,
                  category: true,
                  parentPage: {
                    _id: true,
                  },
                },
              },
            },
          ]}
        >
          {async ([{ documentation }]) => {
            "use server";

            type DocItem = {
              _id: string;
              _title: string;
              _slug: string;
              category: string | null;
              parentPage?: { _id: string } | null;
            };

            const docItems = documentation?.items || [];
            
            // Build a map for quick lookup
            const itemMap = new Map<string, DocItem>();
            const childrenMap = new Map<string, DocItem[]>();
            
            for (const item of docItems) {
              itemMap.set(item._id, item);
              
              // Track children
              const parentId = item.parentPage?._id;
              if (parentId) {
                if (!childrenMap.has(parentId)) {
                  childrenMap.set(parentId, []);
                }
                childrenMap.get(parentId)!.push(item);
              }
            }

            // Recursively build tree nodes
            const buildNode = (item: DocItem, isRoot: boolean = false): PageTree.Node => {
              const children = childrenMap.get(item._id);
              const hasChildren = children && children.length > 0;

              if (hasChildren) {
                return {
                  type: "folder",
                  name: item._title,
                  index: isRoot ? undefined : {
                    type: "page",
                    name: item._title,
                    url: `/resources/${item._slug}`,
                  },
                  children: children.map((child) => buildNode(child, false)),
                };
              }

              return {
                type: "page",
                name: item._title,
                url: `/resources/${item._slug}`,
              };
            };

            // Build PageTree structure from BaseHub data
            const items: PageTree.Node[] = [];
            const categoryGroups: Record<string, PageTree.Node[]> = {};

            // Only process root-level items (no parent)
            for (const item of docItems) {
              if (item.parentPage?._id) continue; // Skip items with parents
              
              const node = buildNode(item);

              if (item.category && item.category !== "Root") {
                if (!categoryGroups[item.category]) {
                  categoryGroups[item.category] = [];
                }
                categoryGroups[item.category].push(node);
              } else {
                items.push(node);
              }
            }

            // Add categorized items as collapsible folders
            for (const [category, pages] of Object.entries(categoryGroups)) {
              items.push({
                type: "folder",
                name: category,
                children: pages,
              });
            }

            return (
              <>
                <SidebarProvider defaultOpen={!defaultClose}>
                  <ResourcesSidebar variant="inset" tree={items} />
                  <SidebarInset>
                    <ResourcesHeader 
                      toolbarComponent={<BaseHubToolbarWrapper />}
                    />
                    <div
                      id="content"
                      className={cn(
                        "flex h-full w-full min-w-0 flex-col",
                        "has-[div[data-layout=fixed]]:h-svh",
                        "group-data-[scroll-locked=1]/body:h-full",
                        "has-[data-layout=fixed]:group-data-[scroll-locked=1]/body:h-svh"
                      )}
                    >
                      {children}
                    </div>
                  </SidebarInset>
                </SidebarProvider>
                <DraftModeIndicator isDraftMode={isEnabled} />
              </>
            );
          }}
        </Pump>
      </SWRProvider>
    </div>
  );
}
