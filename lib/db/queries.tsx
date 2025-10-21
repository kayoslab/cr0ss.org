import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import {
  ZBrewMethodsToday, ZConsistency,
  ZTrend, ZScatter, ZBlocks, ZStreak, ZMonthlyProgress, ZPaceSeries, ZHeat,
  ZDayHabits,
} from "./models";
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

  interface CoffeeCountRow {
    coffee_cf_id: string;
    count: number;
  }

  const idCounts = new Map<string, number>(rows.map((r) => [String((r as CoffeeCountRow).coffee_cf_id), Number((r as CoffeeCountRow).count)]));
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

// ---- Caffeine Kinetics ----

/** Brew events between [startISO, endISO) with amount_ml. */
export const ZCoffeeEvent = z.object({
  timeISO: z.string(),
  type: z.string(),
  amount_ml: z.number().int().min(0).nullable().optional(),
});

export async function qCoffeeEventsForDayWithLookback(
  dayStartISO: string,
  dayEndISO: string,
  lookbackHours: number,
  filterDecaf = true
) {
  const startMs = Date.parse(dayStartISO) - Math.max(0, lookbackHours) * 3600_000;
  const lookbackStartISO = new Date(startMs).toISOString();

  const rows = await sql/*sql*/`
    select time, type, amount_ml, coffee_cf_id::text as coffee_cf_id
    from coffee_log
    where time >= ${lookbackStartISO}::timestamptz
      and time <  ${dayEndISO}::timestamptz
    order by time asc
  `;

  interface CoffeeEventRow {
    time: Date;
    type: string;
    amount_ml: number | null;
    coffee_cf_id: string | null;
  }

  let events = rows.map((r) => {
    const row = r as CoffeeEventRow;
    return {
      timeISO: row.time.toISOString(), // raw UTC
      type: String(row.type),
      amount_ml: row.amount_ml === null ? null : Number(row.amount_ml),
      coffee_cf_id: row.coffee_cf_id ? String(row.coffee_cf_id) : null,
    };
  });

  if (filterDecaf) {
    // Resolve only linked bags (ignore "0" or empty → treated as caffeinated)
    const ids = Array.from(
      new Set(events.map(e => e.coffee_cf_id).filter((x): x is string => !!x && x !== "0"))
    );

    if (ids.length > 0) {
      // getCoffees(ids) → { items: [{ sys.id, decaffeinated?... }] }
      const { items = [] } = await getCoffees(ids as [string]);
      // Adjust this accessor if your Contentful model stores the flag under fields.decaffeinated
      const decafIds = new Set(
        items
          .filter((c) => c?.decaffeinated === true || c?.fields?.decaffeinated === true)
          .map((c) => c?.sys?.id)
          .filter((id): id is string => Boolean(id))
      );

      events = events.filter(e => !(e.coffee_cf_id && decafIds.has(e.coffee_cf_id)));
    }
  }

  // Strip the helper field before returning and validate
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const out = events.map(({ coffee_cf_id, ...rest }) => rest);
  return z.array(ZCoffeeEvent).parse(out);
}

// ---- Daily Habits
export async function qHabitsToday() {
  const rows = await sql/*sql*/`
    select
      to_char(date,'YYYY-MM-DD') as date,
      steps, reading_minutes, outdoor_minutes, writing_minutes, coding_minutes,
      coalesce(focus_minutes,0)::int as focus_minutes
    from days
    where date = current_date
    limit 1
  `;
  const r = rows[0] ?? {
    date: new Date().toISOString().slice(0,10),
    steps: 0, 
    reading_minutes: 0,
    outdoor_minutes: 0,
    writing_minutes: 0,
    coding_minutes: 0,
    focus_minutes: 0,
  };
  return ZDayHabits.parse(r);
}

export async function qHabitConsistencyThisWeek() {
  const rows = await sql/*sql*/`
    select
      to_char(date,'YYYY-MM-DD') as date,
      steps, reading_minutes, outdoor_minutes, writing_minutes, coding_minutes
    from days
    where date >= current_date - interval '6 days'
    order by date asc
  `;
  interface HabitRow {
    steps: number | null;
    reading_minutes: number | null;
    outdoor_minutes: number | null;
    writing_minutes: number | null;
    coding_minutes: number | null;
  }

  const days = rows.map((r) => {
    const row = r as HabitRow;
    return {
      steps: Number(row.steps || 0),
      read: Number(row.reading_minutes || 0),
      outdoor: Number(row.outdoor_minutes || 0),
      write: Number(row.writing_minutes || 0),
      code: Number(row.coding_minutes || 0),
    };
  });

  const total = Math.max(1, days.length);
  const kept = {
    Steps: days.filter(d=> d.steps >= 8000).length,
    Reading: days.filter(d=> d.read >= 30).length,
    Outdoors: days.filter(d=> d.outdoor >= 30).length,
    Writing: days.filter(d=> d.write >= 30).length,
    Coding: days.filter(d=> d.code >= 30).length,
  };
  const arr = [
    { name: "Steps", kept: kept.Steps, total },
    { name: "Reading", kept: kept.Reading, total },
    { name: "Outdoors", kept: kept.Outdoors, total },
    { name: "Writing", kept: kept.Writing, total },
    { name: "Coding", kept: kept.Coding, total },
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
  interface TrendRow {
    date: string;
    writing_minutes: number;
    focus_minutes: number;
  }

  return ZTrend.parse(rows.map((r) => {
    const row = r as TrendRow;
    return {
      date: row.date,
      writing_minutes: Number(row.writing_minutes),
      focus_minutes: Number(row.focus_minutes)
    };
  }));
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
  interface ScatterRow {
    date: string;
    sleep_score: number;
    focus_minutes: number;
  }

  return ZScatter.parse(rows.map((r) => {
    const row = r as ScatterRow;
    return {
      date: row.date,
      sleep_score: Number(row.sleep_score),
      focus_minutes: Number(row.focus_minutes),
    };
  }));
}

export async function qCoffeeInRange(startISO: string, endISO: string) {
  const rows = await sql/*sql*/`
    select date::date as date, time, type::text as type, coalesce(amount_ml,0)::int as amount_ml
    from coffee_log
    where time >= ${startISO}::timestamptz
      and time <  ${endISO}::timestamptz
    order by time asc
  `;
  interface CoffeeRangeRow {
    date: Date;
    time: Date;
    type: string;
    amount_ml: number;
  }

  return rows.map((r) => {
    const row = r as CoffeeRangeRow;
    return {
      date: row.date as unknown as string,
      time: row.time.toISOString(), // raw UTC
      type: row.type,
      amount_ml: Number(row.amount_ml) || 0,
    };
  });
}

export async function qDeepWorkBlocksThisWeek() {
  const rows = await sql/*sql*/`
    select to_char(date,'YYYY-MM-DD') as date, coalesce(focus_minutes,0)::int as focus
    from days
    where date >= current_date - interval '6 days'
    order by date asc
  `;
  interface BlocksRow {
    date: string;
    focus: number;
  }

  const data = rows.map((r) => {
    const row = r as BlocksRow;
    return { date: row.date, blocks: Math.round(Number(row.focus) / 50) };
  }); // ~50-min block
  return ZBlocks.parse(data);
}

// Start of current month in Europe/Berlin (as DATE)
async function currentMonthStart(): Promise<string> {
  const [{ month_start }] = await sql/*sql*/`
    SELECT (date_trunc('month', timezone('Europe/Berlin', now()))::date) AS month_start
  `;
  return month_start as string; // e.g. "2025-09-01"
}

// Read a monthly goal by kind for the current month; default 0 if missing
async function currentGoal(kind:
  | 'focus_minutes'
  | 'running_distance_km'
  | 'steps'
  | 'reading_minutes'
  | 'outdoor_minutes'
  | 'writing_minutes'
  | 'coding_minutes'
): Promise<number> {
  const monthStart = await currentMonthStart();
  const rows = await sql/*sql*/`
    SELECT target::numeric AS target
    FROM monthly_goals
    WHERE month = ${monthStart}::date AND kind = ${kind}::goal_kind
    LIMIT 1
  `;
  return Number(rows[0]?.target ?? 0);
}

export async function qFocusStreak(target?: number) {
  const threshold = target ?? (await currentGoal('focus_minutes')); // default to DB goal (or 0)
  const rows = await sql/*sql*/`
    SELECT date, coalesce(focus_minutes,0)::int AS focus
    FROM days
    WHERE date <= current_date
    ORDER BY date DESC
    LIMIT 60
  `;
  interface StreakRow {
    date: Date;
    focus: number;
  }

  let streak = 0;
  for (const r of rows) {
    const row = r as StreakRow;
    if (Number(row.focus) >= threshold) streak++;
    else break;
  }
  return ZStreak.parse({ days: streak });
}

export async function qRunningMonthlyProgress() {
  const [progress] = await sql/*sql*/`
    WITH m AS (
      SELECT date_trunc('month', timezone('Europe/Berlin', now()))::date AS month_start
    )
    SELECT
      to_char(m.month_start, 'YYYY-MM-01')                       AS month,
      coalesce((
        SELECT target FROM monthly_goals
        WHERE month = m.month_start AND kind = 'running_distance_km'
      ), 0)::numeric                                             AS target_km,
      coalesce((
        SELECT sum((details->>'distance_km')::numeric) FROM workouts
        WHERE workout_type = 'running'
          AND date >= m.month_start AND date < (m.month_start + interval '1 month')
          AND details ? 'distance_km'
      ), 0)::numeric                                             AS total_km
    FROM m
  `;
  const target = Number(progress.target_km);
  const total  = Number(progress.total_km);
  const pct    = target > 0 ? Math.min(1, total / target) : 0;

  return ZMonthlyProgress.parse({
    month: progress.month,
    target_km: target,
    total_km: total,
    delta_km: total - target,
    pct,
  });
}

export async function qPaceLastRuns(limit=10) {
  const rows = await sql/*sql*/`
    select to_char(date,'YYYY-MM-DD') as date,
           coalesce((details->>'avg_pace_sec_per_km')::int, 0) as avg_pace_sec_per_km
    from workouts
    where workout_type = 'running'
      and details ? 'avg_pace_sec_per_km'
    order by date desc
    limit ${limit}
  `;
  interface PaceRow {
    date: string;
    avg_pace_sec_per_km: number;
  }

  const data = rows.map((r) => {
    const row = r as PaceRow;
    return { date: row.date, avg_pace_sec_per_km: Number(row.avg_pace_sec_per_km) };
  }).reverse();
  return ZPaceSeries.parse(data);
}

export async function qRunningHeatmap(days = 42) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const startStr = start.toISOString().slice(0, 10);

  const rows = await sql/*sql*/`
    select to_char(date,'YYYY-MM-DD') as date,
           coalesce(sum((details->>'distance_km')::numeric),0)::numeric as km
    from workouts
    where workout_type = 'running'
      and date >= ${startStr}::date
      and details ? 'distance_km'
    group by date
  `;
  interface HeatmapRow {
    date: string;
    km: number;
  }

  const byDate = new Map(rows.map((r) => {
    const row = r as HeatmapRow;
    return [row.date, Number(row.km)] as [string, number];
  }));

  const today = new Date();
  const out = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, km: byDate.get(key) ?? 0 };
  });

  return ZHeat.parse(out);
}

export async function qMonthlyGoalsObject(): Promise<Record<string, number>> {
  const [{ month_start }] = await sql/*sql*/`
    SELECT (date_trunc('month', timezone('Europe/Berlin', now()))::date) AS month_start
  `;

  const rows = await sql/*sql*/`
    SELECT kind::text, target::numeric
    FROM monthly_goals
    WHERE month = ${month_start}::date
  `;

  const out: Record<string, number> = {
    running_distance_km: 0,
    steps: 0,
    reading_minutes: 0,
    outdoor_minutes: 0,
    writing_minutes: 0,
    coding_minutes: 0,
    focus_minutes: 0,
  };

  interface GoalRow {
    kind: string;
    target: number;
  }

  for (const r of rows) {
    const row = r as GoalRow;
    const k = String(row.kind);
    const v = Number(row.target);
    if (k in out) out[k] = v;
  }
  return out;
}