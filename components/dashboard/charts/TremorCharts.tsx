'use client';

import dynamic from "next/dynamic";
import React from "react";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`h-full w-full rounded-lg animate-pulse bg-neutral-100/60 dark:bg-neutral-800/60 ${className}`} />
  );
}

const DonutImpl   = dynamic(() => import("@tremor/react").then(m => m.DonutChart),   { ssr: false, loading: () => <Skeleton /> });
const LineImpl    = dynamic(() => import("@tremor/react").then(m => m.LineChart),    { ssr: false, loading: () => <Skeleton /> });
const AreaImpl    = dynamic(() => import("@tremor/react").then(m => m.AreaChart),    { ssr: false, loading: () => <Skeleton /> });
const ScatterImpl = dynamic(() => import("@tremor/react").then(m => m.ScatterChart), { ssr: false, loading: () => <Skeleton /> });
const BarListImpl = dynamic(() => import("@tremor/react").then(m => m.BarList),      { ssr: false, loading: () => <Skeleton /> });
const ProgressImpl= dynamic(() => import("@tremor/react").then(m => m.ProgressBar),  { ssr: false, loading: () => <Skeleton /> });

/** Panel now matches KPI shell exactly */
export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200/60 dark:border-neutral-700 shadow-sm p-4 h-full">
      <div className="uppercase tracking-wider text-neutral-400 text-xs mb-3">{title}</div>
      {children}
    </div>
  );
}

function Empty({ hint }: { hint?: string }) {
  return <div className="text-neutral-500 dark:text-neutral-400 text-sm">No data yet{hint ? ` — ${hint}` : ""}.</div>;
}

/* ------------------------- Donut ------------------------- */
export function Donut({
  title, data, colors = ["emerald", "sky", "violet", "amber", "rose"], isLoading,
}: { title:string; data:{ name:string; value:number }[]; colors?: string[]; isLoading?: boolean }) {
  return (
    <Panel title={title}>
      <div className="h-64">
        {isLoading ? <Skeleton /> : data.length ? (
          <DonutImpl className="h-full" data={data} index="name" category="value" colors={colors} />
        ) : <Empty/>}
      </div>
    </Panel>
  );
}

/* ------------------------- Line ------------------------- */
export function Line({
  title, data, index, categories, colors = ["emerald"], isLoading, showLegend = true,
}: { title:string; data:any[]; index:string; categories:string[]; colors?: string[]; isLoading?: boolean; showLegend?: boolean }) {
  return (
    <Panel title={title}>
      <div className="h-64">
        {isLoading ? <Skeleton /> : data.length ? (
          <LineImpl className="h-full" data={data} index={index} categories={categories} colors={colors} yAxisWidth={42} showLegend={showLegend}/>
        ) : <Empty/>}
      </div>
    </Panel>
  );
}

/* ------------------------- Area ------------------------- */
export function Area({
  title, data, index, categories, colors = ["sky"], isLoading, showLegend = true,
}: { title:string; data:any[]; index:string; categories:string[]; colors?: string[]; isLoading?: boolean; showLegend?: boolean }) {
  return (
    <Panel title={title}>
      <div className="h-64">
        {isLoading ? <Skeleton /> : data.length ? (
          <AreaImpl className="h-full" data={data} index={index} categories={categories} colors={colors} yAxisWidth={42} showLegend={showLegend}/>
        ) : <Empty/>}
      </div>
    </Panel>
  );
}

/* ------------------------- Scatter (single or grouped) ------------------------- */
export function Scatter({
  title, data, x, y, colors = ["violet"], groupField, isLoading,
}: {
  title:string;
  data:{[k:string]:any}[];
  x:string;
  y:string;
  colors?: string[];
  groupField?: string; // optional grouping field
  isLoading?: boolean;
}) {
  // Coerce to numeric & filter invalid
  const prepared = (Array.isArray(data) ? data : [])
    .map((d) => {
      const xv = Number(d[x]), yv = Number(d[y]);
      if (!Number.isFinite(xv) || !Number.isFinite(yv)) return null;
      return d;
    })
    .filter(Boolean) as { [k: string]: any }[];

  const category = groupField ?? "__group";
  const safe = groupField ? prepared : prepared.map((d) => ({ ...d, [category]: "all" }));

  return (
    <Panel title={title}>
      <div className="h-64">
        {isLoading ? <Skeleton /> : safe.length ? (
          <ScatterImpl className="h-full" data={safe} x={x} y={y} category={category} colors={colors} />
        ) : <Empty/>}
      </div>
    </Panel>
  );
}

/* ------------------------- BarList ------------------------- */
export function Bars({ title, items, isLoading }:{
  title:string; items:{name:string; value:number}[]; isLoading?: boolean;
}) {
  return (
    <Panel title={title}>
      <div className="min-h-28">
        {isLoading ? <Skeleton className="h-28" /> : items.length ? <BarListImpl data={items} color="emerald"/> : <Empty/>}
      </div>
    </Panel>
  );
}

/* ------------------------- Progress ------------------------- */
export function Progress({ title, value, target, isLoading }:{
  title:string; value:number; target:number; isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Panel title={title}>
        <Skeleton className="h-7" />
      </Panel>
    );
  }
  const pct = Math.max(0, Math.min(100, target ? (value/target)*100 : 0));
  return (
    <Panel title={title}>
      {target <= 0 ? <Empty hint="target is 0"/> : (
        <>
          <div className="flex justify-between text-sm mb-2">
            <span>{value.toFixed(1)} / {target.toFixed(1)}</span>
            <span>{pct.toFixed(0)}%</span>
          </div>
          <ProgressImpl value={pct}/>
        </>
      )}
    </Panel>
  );
}
