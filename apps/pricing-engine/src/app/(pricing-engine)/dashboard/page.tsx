"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { ChartAreaInteractive, type ChartWidgetData } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards, type KpiWidgetData } from "@/components/section-cards"
import { NotificationsPanel } from "@/components/notifications-panel"
import { InlineCommentsPanel } from "@/components/liveblocks/comments-panel"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DashboardPage() {
  const [chatDealId, setChatDealId] = useState<string | null>(null)

  const { data: dashboardData, isLoading } = useSWR<
    Record<string, { config: Record<string, unknown>; data: unknown; error?: string }>
  >("/api/dashboard/data", fetcher, { refreshInterval: 60_000 })

  const kpiWidgets = useMemo<KpiWidgetData[]>(() => {
    if (!dashboardData) return []
    return ["kpi_1", "kpi_2", "kpi_3", "kpi_4"]
      .map((slot) => {
        const w = dashboardData[slot]
        if (!w) return null
        return {
          config: {
            title: String(w.config.title ?? ""),
            subtitle: (w.config.subtitle as string) ?? null,
            trend_label: (w.config.trend_label as string) ?? null,
            trend_description: (w.config.trend_description as string) ?? null,
            value_format: (w.config.value_format as string) ?? null,
            value_prefix: (w.config.value_prefix as string) ?? null,
            value_suffix: (w.config.value_suffix as string) ?? null,
          },
          data: w.data as { value: number | null; trend_pct: number | null } | null,
        }
      })
      .filter(Boolean) as KpiWidgetData[]
  }, [dashboardData])

  const chartWidget = useMemo<ChartWidgetData | undefined>(() => {
    if (!dashboardData) return undefined
    const w = dashboardData["chart_1"]
    if (!w) return undefined
    return {
      config: {
        title: String(w.config.title ?? "Chart"),
        subtitle: (w.config.subtitle as string) ?? null,
        chart_type: (w.config.chart_type as string) ?? "area",
        x_axis_key: (w.config.x_axis_key as string) ?? "date",
        y_axis_key: (w.config.y_axis_key as string) ?? "value",
      },
      data: Array.isArray(w.data) ? (w.data as Array<Record<string, unknown>>) : null,
    }
  }, [dashboardData])

  return (
    <div className="@container/main flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards widgets={kpiWidgets} loading={isLoading} />
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-[1fr_320px] lg:px-6">
        <div className="flex min-w-0 flex-col gap-4 md:gap-6">
          <ChartAreaInteractive widget={chartWidget} loading={isLoading} />
          <DataTable />
        </div>
        <NotificationsPanel onOpenChat={(dealId) => setChatDealId(dealId)} />
      </div>

      <Sheet
        open={chatDealId !== null}
        onOpenChange={(open) => {
          if (!open) setChatDealId(null)
        }}
      >
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-xl">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>
              {chatDealId ? `Deal ${chatDealId.slice(0, 8)}...` : "Deal Comments"}
            </SheetTitle>
            <SheetDescription>
              View and add comments for this deal
            </SheetDescription>
          </SheetHeader>
          {chatDealId && (
            <div className="min-h-0 flex-1">
              <InlineCommentsPanel dealId={chatDealId} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
