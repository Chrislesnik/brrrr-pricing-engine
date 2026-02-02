import type { ReactNode } from 'react';
import { cookies } from "next/headers";
import { cn } from "@repo/lib/cn";
import { SidebarProvider, SidebarInset } from "@repo/ui/shadcn/sidebar";
import { ResourcesSidebar } from "@/components/layout/resources-sidebar";
import { ResourcesHeader } from "@/components/layout/resources-header";
import { SWRProvider } from "@/components/providers/swr-provider";
import { Pump } from "basehub/react-pump";
import { draftMode } from "next/headers";
import type { PageTree } from "fumadocs-core/server";
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
                },
              },
            },
          ]}
        >
          {async ([{ documentation }]) => {
            "use server";

            // Build PageTree structure from BaseHub data
            const items: PageTree.Node[] = [];
            const categoryGroups: Record<string, PageTree.Node[]> = {};

            // Group items by category
            for (const item of documentation?.items || []) {
              const pageNode: PageTree.Node = {
                type: "page",
                name: item._title,
                url: `/resources/${item._slug}`,
              };

              if (item.category && item.category !== "Root") {
                if (!categoryGroups[item.category]) {
                  categoryGroups[item.category] = [];
                }
                categoryGroups[item.category].push(pageNode);
              } else {
                items.push(pageNode);
              }
            }

            // Add categorized items with separators
            for (const [category, pages] of Object.entries(categoryGroups)) {
              items.push({
                type: "separator",
                name: category,
              });
              items.push(...pages);
            }

            return (
              <>
                <SidebarProvider defaultOpen={!defaultClose}>
                  <ResourcesSidebar variant="inset" tree={items} />
                  <SidebarInset>
                    <ResourcesHeader 
                      toolbarComponent={<BaseHubToolbarWrapper searchKey={documentation._searchKey} />}
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
