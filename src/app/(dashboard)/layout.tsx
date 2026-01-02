import { cookies } from "next/headers"
import { cn } from "@/lib/utils"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { OrgChangeRefresher } from "@/components/org-change-refresher"

interface Props {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: Props) {
  const cookieStore = await cookies()
  const defaultClose = cookieStore.get("sidebar:state")?.value === "false"
  return (
    <div className="border-grid flex flex-1 flex-col">
      <SidebarProvider defaultOpen={!defaultClose}>
        <AppSidebar />
        <div
          id="content"
          className={cn(
            "flex h-full w-full min-w-0 flex-col",
            "has-[div[data-layout=fixed]]:h-svh",
            "group-data-[scroll-locked=1]/body:h-full",
            "has-[data-layout=fixed]:group-data-[scroll-locked=1]/body:h-svh"
          )}
        >
          <OrgChangeRefresher />
          {children}
        </div>
      </SidebarProvider>
    </div>
  )
}
