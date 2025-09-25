import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import {
  ZBrewMethodsToday, ZCaffeineCurve, ZConsistency,
  ZTrend, ZScatter, ZBlocks, ZStreak, ZMonthlyProgress, ZPaceSeries, ZHeat,
  ZDayHabits,
} from "./models";
import { GOALS } from "./constants";
import { getCoffees } from "../contentful/api/coffee";

const sql = neon(process.env.DATABASE_URL!);

// ---- Morning Brew
export async function qBrewMethodsToday() {
  const rows = await sql/*sql*/`
    select type::text, count(*)::int as count
    from coffee_log
    where date = current_date
    group by type
    order by count desc
  `;
  return ZBrewMethodsToday.parse(rows.map(r => ({ type: r.type, count: Number(r.count) })));
}

export async function qCupsToday() {
  const [{ cups }] = await sql/*sql*/`select count(*)::int as cups from coffee_log where date = current_date`;
  return Number(cups) || 0;
}

// Weekly origins via Contentful IDs on brews
export async function qCoffeeOriginThisWeek() {
  const rows = await sql/*sql*/`
    select coffee_cf_id, count(*)::int as count
    from coffee_log
    where date >= current_date - interval '6 days'
      and coffee_cf_id is not null
    group by coffee_cf_id
  `;

  const idCounts = new Map<string, number>(rows.map((r:any) => [String(r.coffee_cf_id), Number(r.count)]));
  if (idCounts.size === 0) return [] as { name: string; value: number }[];

  const coffees = await getCoffees(Array.from(idCounts.keys()) as [string]);

  // aggregate by country ID (we can resolve to names later)
  const byCountry = new Map<string, number>();

  for (const [cid, n] of Array.from(idCounts.entries())) {
    const coffee = coffees.items.find(c => c.sys?.id === cid);
    const countryName = coffee?.country?.name ?? "Unknown";
    byCountry.set(countryName, (byCountry.get(countryName) ?? 0) + n);
  }

  const out = Array.from(byCountry.entries()).map(([name, value]) => ({ name, value }));
  out.sort((a,b)=> b.value - a.value);
  return out;
}

export const ZCoffeeEvent = z.object({
  timeISO: z.string(),
  type: z.string(),
  amount_ml: z.number().int().min(0).nullable().optional(),
});

export async function qCoffeeEventsLast24h() {
  const startIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const rows = await sql/*sql*/`
    select timezone('Europe/Berlin', time) as t_local, type, amount_ml
    from coffee_log
    where time >= ${startIso}::timestamptz
    order by time asc
  `;
  const out = rows.map((r:any) => ({
    timeISO: new Date(r.t_local).toISOString(),
    type: String(r.type),
    amount_ml: r.amount_ml === null ? null : Number(r.amount_ml),
  }));
  return z.array(ZCoffeeEvent).parse(out);
}


export async function qCaffeineCurveToday() {
  // last 24h window
  const startIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const rows = await sql/*sql*/`
    select
      extract(hour from timezone('Europe/Berlin', time))::int as hour,
      sum(
        case type
          when 'espresso'   then 80
          when 'v60'        then 120
          when 'chemex'     then 120
          when 'moka'       then 100
          when 'aero'       then 110
          when 'cold_brew'  then 150
          else 90
        end
      )::int as mg
    from coffee_log
    where time >= ${startIso}::timestamptz
    group by 1
    order by 1
  `;

  // Fill 0..23 with zeros so the chart always has a full day
  const byHour = new Map(rows.map((r: any) => [Number(r.hour), Number(r.mg)]));
  const out = Array.from({ length: 24 }, (_, h) => ({ hour: h, mg: byHour.get(h) ?? 0 }));

  return ZCaffeineCurve.parse(out);
}

// ---- Daily Habits
export async function qHabitsToday() {
  const rows = await sql/*sql*/`
    select
      to_char(date,'YYYY-MM-DD') as date,
      steps, reading_minutes, outdoor_minutes, writing_minutes, coding_minutes, journaled,
      coalesce(focus_minutes,0)::int as focus_minutes
    from days
    where date = current_date
    limit 1
  `;
  const r = rows[0] ?? {
    date: new Date().toISOString().slice(0,10),
    steps: 0, reading_minutes: 0, outdoor_minutes: 0, writing_minutes: 0, coding_minutes: 0, journaled: false, focus_minutes: 0,
  };
  return ZDayHabits.parse(r);
}

export async function qHabitConsistencyThisWeek() {
  const rows = await sql/*sql*/`
    select
      to_char(date,'YYYY-MM-DD') as date,
      steps, reading_minutes, outdoor_minutes, journaled
    from days
    where date >= current_date - interval '6 days'
    order by date asc
  `;
  const days = rows.map((r:any)=> ({
    steps: Number(r.steps||0),
    read: Number(r.reading_minutes||0),
    out: Number(r.outdoor_minutes||0),
    journ: !!r.journaled,
  }));
  const total = Math.max(1, days.length);
  const kept = {
    Steps: days.filter(d=> d.steps >= 8000).length,
    Reading: days.filter(d=> d.read >= 30).length,
    Outdoors: days.filter(d=> d.out >= 30).length,
    Journaling: days.filter(d=> d.journ).length,
  };
  const arr = [
    { name: "Steps", kept: kept.Steps, total },
    { name: "Reading", kept: kept.Reading, total },
    { name: "Outdoors", kept: kept.Outdoors, total },
    { name: "Journaling", kept: kept.Journaling, total },
  ];
  return ZConsistency.parse(arr);
}

export async function qWritingVsFocusTrend(days=14) {
  const start = new Date();
  start.setUTCHours(0,0,0,0);
  start.setDate(start.getDate() - (days-1));
  const startStr = start.toISOString().slice(0,10);

  const rows = await sql/*sql*/`
    select to_char(date,'YYYY-MM-DD') as date,
           coalesce(writing_minutes,0)::int as writing_minutes,
           coalesce(focus_minutes,0)::int as focus_minutes
    from days
    where date >= ${startStr}::date
    order by date asc
  `;
  return ZTrend.parse(rows.map((r:any)=> ({
    date: r.date, writing_minutes: Number(r.writing_minutes), focus_minutes: Number(r.focus_minutes)
  })));
}

// ---- Focus & Flow
export async function qSleepVsFocusScatter(days = 30) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const startStr = start.toISOString().slice(0, 10);

  const rows = await sql/*sql*/`
    select to_char(date,'YYYY-MM-DD') as date,
           coalesce(sleep_score,0)::int as sleep_score,
           coalesce(focus_minutes,0)::int as focus_minutes
    from days
    where date >= ${startStr}::date
    order by date asc
  `;
  return ZScatter.parse(rows.map((r:any) => ({
    date: r.date,
    sleep_score: Number(r.sleep_score),
    focus_minutes: Number(r.focus_minutes),
  })));
}

export async function qDeepWorkBlocksThisWeek() {
  const rows = await sql/*sql*/`
    select to_char(date,'YYYY-MM-DD') as date, coalesce(focus_minutes,0)::int as focus
    from days
    where date >= current_date - interval '6 days'
    order by date asc
  `;
  const data = rows.map((r:any)=> ({ date: r.date, blocks: Math.round(Number(r.focus)/50) })); // ~50-min block
  return ZBlocks.parse(data);
}

export async function qFocusStreak(target = GOALS.focusMinutes) {
  const rows = await sql/*sql*/`
    select date, coalesce(focus_minutes,0)::int as focus
    from days
    where date <= current_date
    order by date desc
    limit 60
  `;
  let streak = 0;
  for (const r of rows) {
    if (Number(r.focus) >= target) streak++; else break;
  }
  return ZStreak.parse({ days: streak });
}

// ---- Running & Movement
export async function qRunningMonthlyProgress() {
  const [progress] = await sql/*sql*/`
    with m as (select date_trunc('month', current_date)::date as month_start)
    select
      to_char(m.month_start,'YYYY-MM-01') as month,
      coalesce((select target from monthly_goals where month = m.month_start and kind='running_distance_km'), ${GOALS.runningMonthlyKm})::numeric as target_km,
      coalesce((select sum(distance_km) from runs where date >= m.month_start and date < (m.month_start + interval '1 month')),0)::numeric as total_km
    from m
  `;
  const target = Number(progress.target_km);
  const total = Number(progress.total_km);
  const pct = target > 0 ? Math.min(1, total/target) : 0;
  return ZMonthlyProgress.parse({
    month: progress.month, target_km: target, total_km: total, delta_km: total - target, pct
  });
}

export async function qPaceLastRuns(limit=10) {
  const rows = await sql/*sql*/`
    select to_char(date,'YYYY-MM-DD') as date, coalesce(avg_pace_sec_per_km,0)::int as pace_sec_per_km
    from runs
    order by date desc
    limit ${limit}
  `;
  const data = rows.map((r:any)=> ({ date: r.date, pace_sec_per_km: Number(r.pace_sec_per_km) })).reverse();
  return ZPaceSeries.parse(data);
}

export async function qRunningHeatmap(days = 42) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const startStr = start.toISOString().slice(0, 10);

  const rows = await sql/*sql*/`
    select to_char(date,'YYYY-MM-DD') as date,
           coalesce(sum(distance_km),0)::numeric as km
    from runs
    where date >= ${startStr}::date
    group by date
  `;
  const byDate = new Map(rows.map((r:any) => [r.date, Number(r.km)]));

  const today = new Date();
  const out = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, km: byDate.get(key) ?? 0 };
  });

  return ZHeat.parse(out);
}