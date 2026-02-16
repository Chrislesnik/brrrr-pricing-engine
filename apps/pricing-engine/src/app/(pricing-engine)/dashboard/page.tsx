import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { NotificationsPanel } from "@/components/notifications-panel"

export default function DashboardPage() {
  return (
    <div className="@container/main flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-[1fr_320px] lg:px-6">
        <div className="flex min-w-0 flex-col gap-4 md:gap-6">
          <ChartAreaInteractive />
          <DataTable />
        </div>
        <NotificationsPanel />
      </div>
    </div>
  )
}
