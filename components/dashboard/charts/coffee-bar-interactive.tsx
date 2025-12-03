"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

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
import { getChartColor } from "@/lib/constants/chart-colors"

const chartConfig = {
  cups: {
    label: "Cups",
    color: getChartColor(0),
  },
} satisfies ChartConfig

type CoffeeBarInteractiveProps = {
  data: { date: string; cups: number }[];
}

export function CoffeeBarInteractive({ data }: CoffeeBarInteractiveProps) {
  const total = React.useMemo(
    () => data.reduce((acc, curr) => acc + curr.cups, 0),
    [data]
  )

  const average = React.useMemo(
    () => Math.round((total / data.length) * 10) / 10,
    [total, data.length]
  )

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-6">
          <CardTitle>Daily Coffee Consumption</CardTitle>
          <CardDescription>
            Last 30 days
          </CardDescription>
        </div>
        <div className="flex">
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left sm:border-t-0 sm:border-l sm:px-8 sm:py-6">
            <span className="text-muted-foreground text-xs">
              Total Cups
            </span>
            <span className="text-lg leading-none font-bold sm:text-3xl">
              {total}
            </span>
          </div>
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left border-l sm:border-t-0 sm:px-8 sm:py-6">
            <span className="text-muted-foreground text-xs">
              Daily Average
            </span>
            <span className="text-lg leading-none font-bold sm:text-3xl">
              {average}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
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
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="cups"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  formatter={(value, name) => {
                    return (
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: chartConfig.cups.color }}
                        />
                        <span className="text-muted-foreground">{chartConfig.cups.label}</span>
                        <span className="ml-auto font-mono font-medium tabular-nums">{value}</span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar dataKey="cups" fill={chartConfig.cups.color} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
