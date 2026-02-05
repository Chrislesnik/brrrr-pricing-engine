import { cookies } from "next/headers"
import { cn } from "@repo/lib/cn"
import { SidebarProvider, SidebarInset } from "@repo/ui/shadcn/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SWRProvider } from "@/components/providers/swr-provider"
import { SiteHeader } from "@/components/layout/site-header"

interface Props {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: Props) {
  const cookieStore = await cookies()
  const defaultClose = cookieStore.get("sidebar:state")?.value === "false"
  return (
    <div className="border-grid flex flex-1 flex-col h-full">
      <SWRProvider>
        <SidebarProvider defaultOpen={!defaultClose}>
          <AppSidebar variant="inset" />
          <SidebarInset className="max-h-screen">
            <SiteHeader />
            <div
              id="content"
              className={cn(
                "flex h-full w-full min-w-0 flex-col overflow-y-auto",
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
  )
}
