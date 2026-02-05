import type { ReactNode } from "react";
import { cookies, draftMode } from "next/headers";
import { cn } from "@repo/lib/cn";
import { SidebarProvider, SidebarInset } from "@repo/ui/shadcn/sidebar";
import { DocsSidebar } from "@/components/layout/docs-sidebar";
import { DocsHeader } from "@/components/layout/docs-header";
import { SWRProvider } from "@/components/providers/swr-provider";
import { Pump } from "basehub/react-pump";
import type * as PageTree from "fumadocs-core/page-tree";

interface Props {
  children: ReactNode;
}

export default async function DocsLayout({ children }: Props) {
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

            const items: PageTree.Node[] = [];
            const categoryGroups: Record<string, PageTree.Node[]> = {};

            for (const item of documentation?.items || []) {
              const pageNode: PageTree.Node = {
                type: "page",
                name: item._title,
                url: `/docs/${item._slug}`,
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

            for (const [category, pages] of Object.entries(categoryGroups)) {
              items.push({
                type: "separator",
                name: category,
              });
              items.push(...pages);
            }

            return (
              <SidebarProvider defaultOpen={!defaultClose}>
                <DocsSidebar variant="inset" tree={items} />
                <SidebarInset>
                  <DocsHeader />
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
            );
          }}
        </Pump>
      </SWRProvider>
    </div>
  );
}
