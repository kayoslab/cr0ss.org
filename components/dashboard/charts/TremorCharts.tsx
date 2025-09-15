'use client';

import dynamic from "next/dynamic";
import React from "react";

const DonutChart   = dynamic(() => import("@tremor/react").then(m => m.DonutChart),   { ssr: false });
const LineChart    = dynamic(() => import("@tremor/react").then(m => m.LineChart),    { ssr: false });
const AreaChart    = dynamic(() => import("@tremor/react").then(m => m.AreaChart),    { ssr: false });
const ScatterChart = dynamic(() => import("@tremor/react").then(m => m.ScatterChart), { ssr: false });
const BarList      = dynamic(() => import("@tremor/react").then(m => m.BarList),      { ssr: false });
const ProgressBar  = dynamic(() => import("@tremor/react").then(m => m.ProgressBar),  { ssr: false });

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-800 p-4">
      <div className="text-sm mb-3 text-neutral-400">{title}</div>
      {children}
    </div>
  );
}
function Empty({ hint }: { hint?: string }) {
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
  title, data, index, categories, colors = ["emerald"],
}: { title:string; data:any[]; index:string; categories:string[]; colors?: string[] }) {
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
          />
        </div>
      ) : <Empty/>}
    </Panel>
  );
}

export function Area({
  title, data, index, categories, colors = ["sky"],
}: { title:string; data:any[]; index:string; categories:string[]; colors?: string[] }) {
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
          />
        </div>
      ) : <Empty/>}
    </Panel>
  );
}

export function Scatter({
  title, data, x, y, colors = ["violet"],
}: { title:string; data:{[k:string]:any}[]; x:string; y:string; colors?: string[] }) {
  return (
    <Panel title={title}>
      {data.length ? (
        <div className="h-64">
          <ScatterChart 
          className="h-full" 
          data={data} 
          x={x} 
          y={y} 
          colors={colors} 
          category=""
          />
        </div>
      ) : <Empty/>}
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
