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
    <div className="border-grid flex h-svh flex-col overflow-hidden">
      <SWRProvider>
        <OrgThemeLoader />
        <SidebarProvider defaultOpen={!defaultClose}>
          <AppSidebar variant="inset" />
          <SidebarInset className="min-h-0 h-full">
            <SiteHeader />
            <div
              id="content"
              className={cn(
                "flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto",
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
