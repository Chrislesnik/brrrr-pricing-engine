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

  const formatSegment = (segment: string) =>
    segment
      .split(/[-_]/g)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const getOrCreateFolder = (
    index: Map<string, PageTree.Folder>,
    key: string,
    name: string,
    container: PageTree.Node[],
    defaultOpen = false
  ) => {
    let folder = index.get(key);
    if (!folder) {
      folder = {
        type: "folder",
        name,
        children: [],
        collapsible: true,
        defaultOpen,
      };
      index.set(key, folder);
      container.push(folder);
    }
    return folder;
  };

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
            const folderIndex = new Map<string, PageTree.Folder>();

            for (const item of documentation?.items || []) {
              const slug = item._slug?.trim() ?? "";
              if (!slug) continue;

              const pageNode: PageTree.Item = {
                type: "page",
                name: item._title,
                url: `/docs/${slug}`,
              };

              let container = items;
              let keyPrefix = "";

              if (item.category && item.category !== "Root") {
                keyPrefix = `cat:${item.category}`;
                const categoryFolder = getOrCreateFolder(
                  folderIndex,
                  keyPrefix,
                  item.category,
                  items,
                  true
                );
                container = categoryFolder.children;
              }

              const segments = slug.split("/").filter(Boolean);
              for (let i = 0; i < segments.length - 1; i += 1) {
                keyPrefix = `${keyPrefix}/${segments[i]}`;
                const folder = getOrCreateFolder(
                  folderIndex,
                  keyPrefix,
                  formatSegment(segments[i]),
                  container
                );
                container = folder.children;
              }

              container.push(pageNode);
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
