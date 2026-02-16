"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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
const chartData = [
  { date: "2024-04-01", funded: 3 },
  { date: "2024-04-02", funded: 1 },
  { date: "2024-04-03", funded: 2 },
  { date: "2024-04-04", funded: 4 },
  { date: "2024-04-05", funded: 5 },
  { date: "2024-04-06", funded: 3 },
  { date: "2024-04-07", funded: 2 },
  { date: "2024-04-08", funded: 6 },
  { date: "2024-04-09", funded: 1 },
  { date: "2024-04-10", funded: 3 },
  { date: "2024-04-11", funded: 5 },
  { date: "2024-04-12", funded: 4 },
  { date: "2024-04-13", funded: 5 },
  { date: "2024-04-14", funded: 2 },
  { date: "2024-04-15", funded: 1 },
  { date: "2024-04-16", funded: 2 },
  { date: "2024-04-17", funded: 7 },
  { date: "2024-04-18", funded: 5 },
  { date: "2024-04-19", funded: 3 },
  { date: "2024-04-20", funded: 1 },
  { date: "2024-04-21", funded: 2 },
  { date: "2024-04-22", funded: 3 },
  { date: "2024-04-23", funded: 2 },
  { date: "2024-04-24", funded: 6 },
  { date: "2024-04-25", funded: 3 },
  { date: "2024-04-26", funded: 1 },
  { date: "2024-04-27", funded: 6 },
  { date: "2024-04-28", funded: 2 },
  { date: "2024-04-29", funded: 4 },
  { date: "2024-04-30", funded: 7 },
  { date: "2024-05-01", funded: 2 },
  { date: "2024-05-02", funded: 4 },
  { date: "2024-05-03", funded: 3 },
  { date: "2024-05-04", funded: 6 },
  { date: "2024-05-05", funded: 7 },
  { date: "2024-05-06", funded: 8 },
  { date: "2024-05-07", funded: 5 },
  { date: "2024-05-08", funded: 2 },
  { date: "2024-05-09", funded: 3 },
  { date: "2024-05-10", funded: 4 },
  { date: "2024-05-11", funded: 5 },
  { date: "2024-05-12", funded: 3 },
  { date: "2024-05-13", funded: 3 },
  { date: "2024-05-14", funded: 7 },
  { date: "2024-05-15", funded: 7 },
  { date: "2024-05-16", funded: 5 },
  { date: "2024-05-17", funded: 8 },
  { date: "2024-05-18", funded: 5 },
  { date: "2024-05-19", funded: 3 },
  { date: "2024-05-20", funded: 2 },
  { date: "2024-05-21", funded: 1 },
  { date: "2024-05-22", funded: 1 },
  { date: "2024-05-23", funded: 4 },
  { date: "2024-05-24", funded: 4 },
  { date: "2024-05-25", funded: 3 },
  { date: "2024-05-26", funded: 3 },
  { date: "2024-05-27", funded: 6 },
  { date: "2024-05-28", funded: 3 },
  { date: "2024-05-29", funded: 1 },
  { date: "2024-05-30", funded: 5 },
  { date: "2024-05-31", funded: 2 },
  { date: "2024-06-01", funded: 2 },
  { date: "2024-06-02", funded: 7 },
  { date: "2024-06-03", funded: 1 },
  { date: "2024-06-04", funded: 6 },
  { date: "2024-06-05", funded: 1 },
  { date: "2024-06-06", funded: 4 },
  { date: "2024-06-07", funded: 5 },
  { date: "2024-06-08", funded: 6 },
  { date: "2024-06-09", funded: 7 },
  { date: "2024-06-10", funded: 2 },
  { date: "2024-06-11", funded: 1 },
  { date: "2024-06-12", funded: 8 },
  { date: "2024-06-13", funded: 1 },
  { date: "2024-06-14", funded: 6 },
  { date: "2024-06-15", funded: 4 },
  { date: "2024-06-16", funded: 5 },
  { date: "2024-06-17", funded: 7 },
  { date: "2024-06-18", funded: 1 },
  { date: "2024-06-19", funded: 5 },
  { date: "2024-06-20", funded: 6 },
  { date: "2024-06-21", funded: 2 },
  { date: "2024-06-22", funded: 5 },
  { date: "2024-06-23", funded: 8 },
  { date: "2024-06-24", funded: 2 },
  { date: "2024-06-25", funded: 2 },
  { date: "2024-06-26", funded: 7 },
  { date: "2024-06-27", funded: 7 },
  { date: "2024-06-28", funded: 2 },
  { date: "2024-06-29", funded: 1 },
  { date: "2024-06-30", funded: 7 },
]

const chartConfig = {
  funded: {
    label: "Deals Funded",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Deals Funded</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            Deals funded over the last{" "}
            {timeRange === "90d"
              ? "3 months"
              : timeRange === "30d"
                ? "30 days"
                : "7 days"}
          </span>
          <span className="@[540px]/card:hidden">
            Last{" "}
            {timeRange === "90d"
              ? "3 months"
              : timeRange === "30d"
                ? "30 days"
                : "7 days"}
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
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillFunded" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-funded)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-funded)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="funded"
              type="natural"
              fill="url(#fillFunded)"
              stroke="var(--color-funded)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
