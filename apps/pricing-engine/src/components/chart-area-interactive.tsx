"use client"

import * as React from "react"
import { Area, AreaChart, Bar, BarChart, Line, LineChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"

export interface ChartWidgetConfig {
  title: string
  subtitle: string | null
  chart_type: string | null
  x_axis_key: string | null
  y_axis_key: string | null
}

export interface ChartWidgetData {
  config: ChartWidgetConfig
  data: Array<Record<string, unknown>> | null
  configured?: boolean
}

interface ChartAreaInteractiveProps {
  widget?: ChartWidgetData
  loading?: boolean
}

export function ChartAreaInteractive({ widget, loading }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const config = widget?.config
  const rawData = widget?.data
  const isConfigured = widget?.configured !== false
  const title = config?.title ?? "Chart"
  const subtitle = config?.subtitle ?? ""
  const chartType = config?.chart_type ?? "area"
  const xKey = config?.x_axis_key ?? "date"
  const yKey = config?.y_axis_key ?? "value"

  const filteredData = React.useMemo(() => {
    if (!rawData || rawData.length === 0) return []

    const sorted = [...rawData].sort((a, b) => {
      const da = String(a[xKey] ?? "")
      const db = String(b[xKey] ?? "")
      return da.localeCompare(db)
    })

    const lastDateStr = String(sorted[sorted.length - 1]?.[xKey] ?? "")
    const referenceDate = lastDateStr ? new Date(lastDateStr) : new Date()

    if (isNaN(referenceDate.getTime())) return sorted

    let daysToSubtract = 90
    if (timeRange === "30d") daysToSubtract = 30
    else if (timeRange === "7d") daysToSubtract = 7

    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return sorted.filter((item) => {
      const d = new Date(String(item[xKey] ?? ""))
      return !isNaN(d.getTime()) && d >= startDate
    })
  }, [rawData, timeRange, xKey])

  if (loading) {
    return (
      <Card className="@container/card">
        <CardHeader className="relative">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const chartConfig = {
    [yKey]: {
      label: title,
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig

  const timeRangeLabel =
    timeRange === "90d"
      ? "3 months"
      : timeRange === "30d"
        ? "30 days"
        : "7 days"

  const hasData = filteredData.length > 0

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            {subtitle || `${title} over the last ${timeRangeLabel}`}
          </span>
          <span className="@[540px]/card:hidden">
            Last {timeRangeLabel}
          </span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            <ToggleGroupItem value="90d" className="h-8 px-2.5">
              Last 3 months
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5">
              Last 30 days
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5">
              Last 7 days
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="@[767px]/card:hidden flex w-40"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {!hasData ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            {isConfigured
              ? "No data available for the selected time range."
              : "No data available. Configure a SQL query in Settings \u2192 Dashboard."}
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            {chartType === "bar" ? (
              <BarChart data={filteredData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey={xKey}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={formatDateTick}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={formatDateLabel}
                      indicator="dot"
                    />
                  }
                />
                <Bar
                  dataKey={yKey}
                  fill="var(--color-value, hsl(var(--chart-1)))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : chartType === "line" ? (
              <LineChart data={filteredData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey={xKey}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={formatDateTick}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={formatDateLabel}
                      indicator="dot"
                    />
                  }
                />
                <Line
                  dataKey={yKey}
                  type="natural"
                  stroke="var(--color-value, hsl(var(--chart-1)))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            ) : (
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-value, hsl(var(--chart-1)))"
                      stopOpacity={1.0}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-value, hsl(var(--chart-1)))"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey={xKey}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={formatDateTick}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={formatDateLabel}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey={yKey}
                  type="natural"
                  fill="url(#fillValue)"
                  stroke="var(--color-value, hsl(var(--chart-1)))"
                />
              </AreaChart>
            )}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

function formatDateTick(value: unknown): string {
  const date = new Date(String(value))
  if (isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function formatDateLabel(value: unknown): string {
  const date = new Date(String(value))
  if (isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}
