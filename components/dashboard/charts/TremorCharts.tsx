'use client';

import dynamic from "next/dynamic";
import React from "react";

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

const DonutChart   = dynamic(() => import("@tremor/react").then(m => m.DonutChart),   { ssr: false });
const LineChart    = dynamic(() => import("@tremor/react").then(m => m.LineChart),    { ssr: false });
const AreaChart    = dynamic(() => import("@tremor/react").then(m => m.AreaChart),    { ssr: false });
const ScatterChart = dynamic(() => import("@tremor/react").then(m => m.ScatterChart), { ssr: false });
const BarList      = dynamic(() => import("@tremor/react").then(m => m.BarList),      { ssr: false });
const ProgressBar  = dynamic(() => import("@tremor/react").then(m => m.ProgressBar),  { ssr: false });

export function Donut({ title, data }:{ title:string; data:{ name:string; value:number }[] }) {
  return <Panel title={title}>{data.length ? <DonutChart className="h-64" data={data} category="value" index="name" /> : <Empty/>}</Panel>;
}
export function Line({ title, data, index, categories }:{
  title:string; data:any[]; index:string; categories:string[];
}) {
  return <Panel title={title}>{data.length ? <LineChart className="h-64" data={data} index={index} categories={categories} yAxisWidth={42}/> : <Empty/>}</Panel>;
}
export function Area({ title, data, index, categories }:{
  title:string; data:any[]; index:string; categories:string[];
}) {
  return <Panel title={title}>{data.length ? <AreaChart className="h-64" data={data} index={index} categories={categories} yAxisWidth={42}/> : <Empty/>}</Panel>;
}
export function Scatter({ title, data, x, y, category }:{
  title:string; data:{[k:string]:any}[]; x:string; y:string; category:string;
}) {
  return <Panel title={title}>{data.length ? <ScatterChart className="h-64" data={data} x={x} y={y} category={category}/> : <Empty/>}</Panel>;
}
export function Bars({ title, items }:{ title:string; items:{name:string; value:number}[] }) {
  return <Panel title={title}>{items.length ? <BarList data={items}/> : <Empty/>}</Panel>;
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
