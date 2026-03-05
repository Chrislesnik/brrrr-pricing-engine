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

            const items: PageTree.Node[] = [];

            // ── Overview ─────────────────────────────────────────
            items.push({
              type: "folder",
              name: "Overview",
              children: [
                {
                  type: "page",
                  name: "Getting Started",
                  url: "/docs/getting-started",
                } as PageTree.Item,
                {
                  type: "page",
                  name: "Platform Overview",
                  url: "/docs/platform-overview",
                } as PageTree.Item,
              ],
            } as PageTree.Folder);

            // ── Guides ───────────────────────────────────────────
            items.push({
              type: "folder",
              name: "Guides",
              children: [
                {
                  type: "page",
                  name: "Managing Deals",
                  url: "/docs/guides/deals",
                } as PageTree.Item,
                {
                  type: "page",
                  name: "Borrowers & Entities",
                  url: "/docs/guides/borrowers-entities",
                } as PageTree.Item,
                {
                  type: "page",
                  name: "Document Storage",
                  url: "/docs/guides/documents",
                } as PageTree.Item,
                {
                  type: "page",
                  name: "AI Features",
                  url: "/docs/power-users/ai-features",
                } as PageTree.Item,
              ],
            } as PageTree.Folder);

            // ── Policies & Permissions ───────────────────────────
            items.push({
              type: "folder",
              name: "Policies & Permissions",
              children: [
                {
                  type: "page",
                  name: "Row-Level Security",
                  url: "/docs/power-users/rls",
                } as PageTree.Item,
              ],
            } as PageTree.Folder);

            // ── Features ─────────────────────────────────────────
            items.push({
              type: "folder",
              name: "Features",
              children: [
                {
                  type: "page",
                  name: "REST API",
                  url: "/docs/power-users/api-integration",
                } as PageTree.Item,
                {
                  type: "page",
                  name: "SQL & Data Access",
                  url: "/docs/power-users/sql-data-access",
                } as PageTree.Item,
              ],
            } as PageTree.Folder);

            // ── Reference ────────────────────────────────────────
            items.push({
              type: "folder",
              name: "Reference",
              children: [
                {
                  type: "page",
                  name: "API Reference",
                  url: "/docs/api-reference",
                } as PageTree.Item,
                {
                  type: "page",
                  name: "Database Schema",
                  url: "/docs/reference/database-schema",
                } as PageTree.Item,
              ],
            } as PageTree.Folder);

            // ── BaseHub CMS Content ──────────────────────────────
            const folderIndex = new Map<string, PageTree.Folder>();
            const basehubItems: PageTree.Node[] = [];

            const EXCLUDED_SLUGS = new Set([
              "hello-world",
              "supabase-storage",
              "row-level-security",
            ]);

            for (const item of documentation?.items || []) {
              const slug = item._slug?.trim() ?? "";
              if (!slug) continue;

              const leafSegment = slug.split("/").pop() ?? slug;
              if (EXCLUDED_SLUGS.has(leafSegment)) continue;

              const pageNode: PageTree.Item = {
                type: "page",
                name: item._title,
                url: `/docs/${slug}`,
              };

              let container = basehubItems;
              let keyPrefix = "";

              if (item.category && item.category !== "Root") {
                keyPrefix = `cat:${item.category}`;
                const categoryFolder = getOrCreateFolder(
                  folderIndex,
                  keyPrefix,
                  item.category,
                  basehubItems,
                  false
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

            if (basehubItems.length > 0) {
              items.push({
                type: "folder",
                name: "Resources",
                children: basehubItems,
              } as PageTree.Folder);
            }

            return (
              <SidebarProvider defaultOpen={!defaultClose}>
                <DocsSidebar variant="inset" tree={items} />
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
            );
          }}
        </Pump>
      </SWRProvider>
    </div>
  );
}
