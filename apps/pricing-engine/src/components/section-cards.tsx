import { TrendingUpIcon, TrendingDownIcon, Minus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ICON_MAP } from "@/app/(pricing-engine)/org/[orgId]/settings/components/dashboard-settings"

export interface KpiWidgetData {
  config: {
    title: string
    subtitle: string | null
    icon: string | null
    trend_label: string | null
    trend_description: string | null
    value_format: string | null
    value_prefix: string | null
    value_suffix: string | null
  }
  data: { value: number | null; trend_pct: number | null } | null
  configured?: boolean
}

function formatValue(
  value: number | null,
  format: string | null,
  prefix?: string | null,
  suffix?: string | null
): string {
  if (value === null || value === undefined) return "--"

  let formatted: string
  switch (format) {
    case "currency": {
      const abs = Math.abs(value)
      if (abs >= 1_000_000_000) formatted = `$${(value / 1_000_000_000).toFixed(1)}B`
      else if (abs >= 1_000_000) formatted = `$${(value / 1_000_000).toFixed(1)}M`
      else if (abs >= 1_000) formatted = `$${(value / 1_000).toFixed(1)}K`
      else formatted = `$${value.toLocaleString()}`
      break
    }
    case "percentage":
      formatted = `${value}%`
      break
    case "integer":
      formatted = Math.round(value).toLocaleString()
      break
    default:
      formatted = value.toLocaleString()
  }

  if (prefix) formatted = `${prefix}${formatted}`
  if (suffix) formatted = `${formatted}${suffix}`

  return formatted
}

interface SectionCardsProps {
  widgets?: KpiWidgetData[]
  loading?: boolean
}

export function SectionCards({ widgets, loading }: SectionCardsProps) {
  if (loading) {
    return (
      <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader className="relative">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-24 mt-2" />
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-48" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (!widgets || widgets.length === 0) {
    return (
      <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <CardDescription>KPI {i + 1}</CardDescription>
              <CardTitle className="text-2xl font-semibold text-muted-foreground">
                --
              </CardTitle>
            </CardHeader>
            <CardFooter className="text-sm text-muted-foreground">
              Not configured
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      {widgets.map((w, i) => {
        const trendPct = w.data?.trend_pct ?? null
        const isPositive = trendPct !== null && trendPct > 0
        const isNegative = trendPct !== null && trendPct < 0
        const TrendIcon = isPositive
          ? TrendingUpIcon
          : isNegative
            ? TrendingDownIcon
            : Minus

        const KpiIcon = w.config.icon ? ICON_MAP[w.config.icon] : null

        return (
          <Card key={i} className="@container/card">
            <CardHeader className="relative">
              <CardDescription className="flex items-center gap-1.5">
                {KpiIcon && <KpiIcon className="size-3.5" />}
                {w.config.title}
              </CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {formatValue(
                  w.data?.value ?? null,
                  w.config.value_format,
                  w.config.value_prefix,
                  w.config.value_suffix
                )}
              </CardTitle>
              {trendPct !== null && (
                <div className="absolute right-4 top-4">
                  <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                    <TrendIcon className="size-3" />
                    {isPositive ? "+" : ""}
                    {trendPct}%
                  </Badge>
                </div>
              )}
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              {w.config.trend_label && (
                <div className="line-clamp-1 flex gap-2 font-medium">
                  {w.config.trend_label}{" "}
                  <TrendIcon className="size-4" />
                </div>
              )}
              {w.config.trend_description && (
                <div className="text-muted-foreground">
                  {w.config.trend_description}
                </div>
              )}
              {!w.config.trend_label && !w.config.trend_description && !w.data && (
                <div className="text-muted-foreground">
                  {w.configured !== false ? "No data available" : "Not configured"}
                </div>
              )}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
