import { cookies } from "next/headers"
import { cn } from "@repo/lib/cn"
import { SidebarProvider, SidebarInset } from "@repo/ui/shadcn/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SWRProvider } from "@/components/providers/swr-provider"
import { SiteHeader } from "@/components/layout/site-header"
import { OrgThemeLoader } from "@/components/org-theme-loader"

interface Props {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: Props) {
  const cookieStore = await cookies()
  const defaultClose = cookieStore.get("sidebar:state")?.value === "false"
  return (
    <div className="flex h-svh w-full overflow-hidden bg-sidebar">
      <SWRProvider>
        <OrgThemeLoader />
        <SidebarProvider defaultOpen={!defaultClose} className="h-full w-full bg-sidebar">
          <AppSidebar variant="inset" />
          <SidebarInset className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
            <SiteHeader />
            <div
              id="content"
              className={cn(
                "flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-4 pb-4 md:px-6 md:pb-6",
                "has-[div[data-layout=fixed]]:overflow-hidden"
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
