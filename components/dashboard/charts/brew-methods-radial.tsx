"use client"

import * as React from "react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

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

const CHART_COLOR = "oklch(0.646 0.222 41.116)";

const chartConfig = {
  count: {
    label: "Cups",
    color: CHART_COLOR,
  },
} satisfies ChartConfig

type BrewMethodsRadialProps = {
  data: { name: string; value: number }[]
}

export function BrewMethodsRadial({ data }: BrewMethodsRadialProps) {
  // Transform data for radar chart with fill color
  const chartData = data.map(method => ({
    method: method.name,
    count: method.value,
    fill: CHART_COLOR,
  }))

  const totalCups = React.useMemo(
    () => data.reduce((acc, curr) => acc + curr.value, 0),
    [data]
  )

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Brew Methods Today</CardTitle>
        <CardDescription>
          {totalCups} {totalCups === 1 ? 'cup' : 'cups'} brewed
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                    return (
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: CHART_COLOR }}
                        />
                        <span className="text-muted-foreground">{name}</span>
                        <span className="ml-auto font-mono font-medium tabular-nums">{value}</span>
                      </div>
                    );
                  }}
                />
              }
            />
            <PolarAngleAxis dataKey="method" />
            <PolarGrid gridType="circle" />
            <Radar
              dataKey="count"
              fill={CHART_COLOR}
              stroke={CHART_COLOR}
              fillOpacity={0.6}
              dot={{
                r: 4,
                fillOpacity: 1,
              }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
