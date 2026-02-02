import type { ReactNode } from 'react';
import { cookies } from "next/headers";
import { cn } from "@repo/lib/cn";
import { SidebarProvider, SidebarInset } from "@repo/ui/shadcn/sidebar";
import { ResourcesSidebar } from "@/components/layout/resources-sidebar";
import { ResourcesHeader } from "@/components/layout/resources-header";
import { SWRProvider } from "@/components/providers/swr-provider";

interface Props {
  children: ReactNode;
}

export default async function ResourcesRouteLayout({ children }: Props) {
  const cookieStore = await cookies();
  const defaultClose = cookieStore.get("sidebar:state")?.value === "false";
  
  return (
    <div className="border-grid flex flex-1 flex-col">
      <SWRProvider>
        <SidebarProvider defaultOpen={!defaultClose}>
          <ResourcesSidebar variant="inset" />
          <SidebarInset>
            <ResourcesHeader />
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
      </SWRProvider>
    </div>
  );
}
