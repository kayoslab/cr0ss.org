'use client';

import { CurveType } from "@tremor/react";
import dynamic from "next/dynamic";
import React from "react";

const DonutChart   = dynamic(() => import("@tremor/react").then(m => m.DonutChart),   { ssr: false });
const LineChart    = dynamic(() => import("@tremor/react").then(m => m.LineChart),    { ssr: false });
const AreaChart    = dynamic(() => import("@tremor/react").then(m => m.AreaChart),    { ssr: false });
const ScatterChart = dynamic(() => import("@tremor/react").then(m => m.ScatterChart), { ssr: false });
const BarList      = dynamic(() => import("@tremor/react").then(m => m.BarList),      { ssr: false });
const ProgressBar  = dynamic(() => import("@tremor/react").then(m => m.ProgressBar),  { ssr: false });

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200/60 dark:border-neutral-700 shadow-sm p-4">
      <div className="uppercase text-sm mb-3 text-neutral-400">{title}</div>
      {children}
    </div>
  );
}

export function Empty({ hint }: { hint?: string }) {
  return <div className="text-neutral-500 text-sm">No data yet{hint ? ` — ${hint}` : ""}.</div>;
}

export function Donut({
  title, data, colors = ["emerald", "sky", "violet", "amber", "rose"],
}: { title:string; data:{ name:string; value:number }[]; colors?: string[] }) {
  return (
    <Panel title={title}>
      {data.length ? (
        <div className="h-64">
          <DonutChart
            className="h-full"
            data={data}
            index="name"
            category="value"
            colors={colors}
          />
        </div>
      ) : <Empty/>}
    </Panel>
  );
}

export function Line({
  title, data, index, categories, colors = ["emerald"], type = "linear", showLegend = true,
}: { title:string; data:any[]; index:string; categories:string[]; colors?: string[], type?: CurveType, showLegend?: boolean }) {
  return (
    <Panel title={title}>
      {data.length ? (
        <div className="h-64">
          <LineChart
            className="h-full"
            data={data}
            index={index}
            categories={categories}
            colors={colors}
            yAxisWidth={42}
            curveType={type}
            showLegend={showLegend}
          />
        </div>
      ) : <Empty/>}
    </Panel>
  );
}

export function Area({
  title, data, index, categories, colors = ["sky"], showLegend = true,
}: { title:string; data:any[]; index:string; categories:string[]; colors?: string[], showLegend?: boolean }) {
  return (
    <Panel title={title}>
      {data.length ? (
        <div className="h-64">
          <AreaChart
            className="h-full"
            data={data}
            index={index}
            categories={categories}
            colors={colors}
            yAxisWidth={42}
            showLegend={showLegend}
          />
        </div>
      ) : <Empty/>}
    </Panel>
  );
}

export function Scatter({
  title,
  data,
  x,
  y,
  colors = ["violet"],
  groupField, // optional grouping field; omit for single-series
}: {
  title: string;
  data: { [k: string]: any }[];
  x: string;
  y: string;
  colors?: string[];
  groupField?: string;
}) {
  // Coerce to numeric and drop invalid points
  const prepared = (Array.isArray(data) ? data : [])
    .map((d) => {
      const xv = Number(d[x]);
      const yv = Number(d[y]);
      if (!Number.isFinite(xv) || !Number.isFinite(yv)) return null;
      return d;
    })
    .filter(Boolean) as { [k: string]: any }[];

  // Ensure ScatterChart always receives a category string
  const category = groupField ?? "__group";
  const safe =
    groupField
      ? prepared
      : prepared.map((d) => ({ ...d, [category]: "all" })); // single-series fallback

  return (
    <Panel title={title}>
      {safe.length ? (
        <div className="h-64">
          <ScatterChart
            className="h-full"
            data={safe}
            x={x}
            y={y}
            category={category}    // <- always a string
            colors={colors}
          />
        </div>
      ) : (
        <Empty />
      )}
    </Panel>
  );
}

export function Bars({ title, items }:{ title:string; items:{name:string; value:number}[] }) {
  return (
    <Panel title={title}>
      {items.length ? <BarList data={items} color={"emerald"}/> : <Empty/>}
    </Panel>
  );
}

export function Progress({ title, value, target }:{ title:string; value:number; target:number }) {
  const pct = Math.max(0, Math.min(100, target ? (value/target)*100 : 0));
  return (
    <Panel title={title}>
      {target <= 0 ? <Empty hint="target is 0"/> : (
        <>
          <div className="flex justify-between text-sm mb-2">
            <span>{value.toFixed(1)} / {target.toFixed(1)}</span>
            <span>{pct.toFixed(0)}%</span>
          </div>
          <ProgressBar value={pct}/>
        </>
      )}
    </Panel>
  );
}
