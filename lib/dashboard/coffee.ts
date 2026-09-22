/**
 * Coffee dashboard data: daily summary, timeline, caffeine curve, origins.
 * Called directly by Server Components and wrapped by /api/v1/dashboard/coffee/*.
 */
import { z } from 'zod';
import { sql } from '@/lib/db/client';
import { cacheLife, cacheTag } from 'next/cache';
import { tags } from '@/lib/cache/tags';
import { startOfBerlinDayISO, endOfBerlinDayISO } from '@/lib/time/berlin';
import { getBodyProfile } from '@/lib/user/profile';
import { modelCaffeine } from '@/lib/phys/caffeine';
import {
  qCoffeeEventsForDayWithLookback,
  qCoffeeOriginThisWeek,
} from '@/lib/db/queries';

// ---------------------------------------------------------------------------
// Schemas (the API response shapes; pages consume the same objects)
// ---------------------------------------------------------------------------

export const CoffeeSummarySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cups: z.number().int().min(0),
  brewMethods: z.array(
    z.object({ type: z.string(), count: z.number().int().min(0) })
  ),
});
export type CoffeeSummary = z.infer<typeof CoffeeSummarySchema>;

export const CoffeeTimelineSchema = z.object({
  timeline: z.array(
    z.object({
      period: z.string(), // YYYY-MM-DD, YYYY-Www or YYYY-MM
      cups_count: z.number().int().min(0),
      avg_caffeine_mg: z.number().min(0),
    })
  ),
  total_cups: z.number().int().min(0),
  avg_cups_per_day: z.number().min(0),
});
export type CoffeeTimeline = z.infer<typeof CoffeeTimelineSchema>;
export type TimelineGranularity = 'day' | 'week' | 'month';

export const CaffeineCurveSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  series: z.array(
    z.object({
      time: z.string(), // ISO timestamp
      intake_mg: z.number().int().min(0), // cumulative intake
      body_mg: z.number().int().min(0), // modelled body level
    })
  ),
  body_profile: z.object({
    half_life_hours: z.number(),
    sensitivity: z.number(),
    bioavailability: z.number(),
  }),
});
export type CaffeineCurve = z.infer<typeof CaffeineCurveSchema>;

export const CoffeeOriginsSchema = z.object({
  origins: z.array(
    z.object({ name: z.string(), value: z.number().int().min(0) })
  ),
});
export type CoffeeOrigins = z.infer<typeof CoffeeOriginsSchema>;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

async function queryCoffeeSummary(date: string): Promise<CoffeeSummary> {
  const [cupsResult] = await sql /*sql*/ `
    SELECT COUNT(*)::int as cups
    FROM coffee_log
    WHERE date = ${date}::date
  `;
  const brewMethodsRows = await sql /*sql*/ `
    SELECT type::text, COUNT(*)::int as count
    FROM coffee_log
    WHERE date = ${date}::date
    GROUP BY type
    ORDER BY count DESC
  `;
  return CoffeeSummarySchema.parse({
    date,
    cups: Number(cupsResult.cups) || 0,
    brewMethods: brewMethodsRows.map((r) => ({
      type: String(r.type),
      count: Number(r.count),
    })),
  });
}

/** Default caffeine content per brew type (mg per standard serving). */
const DEFAULT_CAFFEINE_MG = {
  espresso: 80,
  v60: 120,
  chemex: 200,
  moka: 100,
  aero: 110,
  cold_brew: 150,
  other: 90,
} as const;

async function queryCoffeeTimeline(
  start_date: string,
  end_date: string,
  granularity: TimelineGranularity
): Promise<CoffeeTimeline> {
  const startMs = Date.parse(start_date);
  const endMs = Date.parse(end_date);
  if (startMs > endMs)
    throw new Error('start_date must be before or equal to end_date');

  const [dateFormat, groupBy] = {
    day: ['YYYY-MM-DD', 'date'],
    week: ['IYYY-"W"IW', "date_trunc('week', date)"], // ISO week (YYYY-Www)
    month: ['YYYY-MM', "date_trunc('month', date)"],
  }[granularity];

  const rows = await sql /*sql*/ `
    SELECT
      to_char(${sql.unsafe(groupBy)}, ${dateFormat}) as period,
      COUNT(*)::int as cups_count,
      AVG(
        CASE type::text
          WHEN 'espresso' THEN ${DEFAULT_CAFFEINE_MG.espresso}::numeric
          WHEN 'v60' THEN ${DEFAULT_CAFFEINE_MG.v60}::numeric
          WHEN 'chemex' THEN ${DEFAULT_CAFFEINE_MG.chemex}::numeric
          WHEN 'moka' THEN ${DEFAULT_CAFFEINE_MG.moka}::numeric
          WHEN 'aero' THEN ${DEFAULT_CAFFEINE_MG.aero}::numeric
          WHEN 'cold_brew' THEN ${DEFAULT_CAFFEINE_MG.cold_brew}::numeric
          ELSE ${DEFAULT_CAFFEINE_MG.other}::numeric
        END
      )::numeric as avg_caffeine_mg
    FROM coffee_log
    WHERE date >= ${start_date}::date
      AND date <= ${end_date}::date
    GROUP BY ${sql.unsafe(groupBy)}
    ORDER BY ${sql.unsafe(groupBy)} ASC
  `;

  const timeline = rows.map((r) => ({
    period: String(r.period),
    cups_count: Number(r.cups_count),
    avg_caffeine_mg: Math.round(Number(r.avg_caffeine_mg)),
  }));
  const total_cups = timeline.reduce((sum, t) => sum + t.cups_count, 0);
  const days = Math.ceil((endMs - startMs) / (24 * 60 * 60 * 1000)) + 1; // inclusive
  return CoffeeTimelineSchema.parse({
    timeline,
    total_cups,
    avg_cups_per_day: days > 0 ? Number((total_cups / days).toFixed(2)) : 0,
  });
}

async function queryCaffeineCurve(
  date: string,
  resolution: number
): Promise<CaffeineCurve> {
  const body = await getBodyProfile();
  const dateObj = new Date(`${date}T12:00:00.000Z`);
  const startISO = startOfBerlinDayISO(dateObj);
  const endISO = endOfBerlinDayISO(dateObj);
  // Look back at least 24h or four half-lives so yesterday's decay is included.
  const half = body.half_life_hours ?? 5;
  const lookbackH = Math.max(24, Math.ceil(half * 4));
  const events = await qCoffeeEventsForDayWithLookback(
    startISO,
    endISO,
    lookbackH
  );
  const series = modelCaffeine(events, body, {
    startMs: Date.parse(startISO),
    endMs: Date.parse(endISO),
    alignToHour: true,
    gridMinutes: resolution,
    halfLifeHours: body.half_life_hours ?? undefined,
  });
  return CaffeineCurveSchema.parse({
    date,
    series: series.map((p) => ({
      time: p.timeISO,
      intake_mg: p.intake_mg,
      body_mg: p.body_mg,
    })),
    body_profile: {
      half_life_hours: body.half_life_hours ?? 5,
      sensitivity: body.caffeine_sensitivity ?? 1.0,
      bioavailability: body.bioavailability ?? 0.9,
    },
  });
}

async function queryCoffeeOrigins(): Promise<CoffeeOrigins> {
  return CoffeeOriginsSchema.parse({ origins: await qCoffeeOriginThisWeek() });
}

// ---------------------------------------------------------------------------
// Cached public API
// ---------------------------------------------------------------------------

export async function getCoffeeSummary(date: string): Promise<CoffeeSummary> {
  'use cache';
  cacheLife('realtime');
  cacheTag(tags.coffee.summary(date), tags.coffee.summary());
  return queryCoffeeSummary(date);
}

export async function getCoffeeTimeline(
  start: string,
  end: string,
  granularity: TimelineGranularity
): Promise<CoffeeTimeline> {
  'use cache';
  cacheLife('frequent');
  cacheTag(
    tags.coffee.timeline(start, end, granularity),
    tags.coffee.timeline()
  );
  return queryCoffeeTimeline(start, end, granularity);
}

export async function getCaffeineCurve(
  date: string,
  resolution: number
): Promise<CaffeineCurve> {
  'use cache';
  cacheLife('realtime');
  cacheTag(tags.coffee.caffeine(date), tags.coffee.caffeine());
  return queryCaffeineCurve(date, resolution);
}

export async function getCoffeeOrigins(): Promise<CoffeeOrigins> {
  'use cache';
  cacheLife('frequent');
  cacheTag(tags.coffee.origins);
  return queryCoffeeOrigins();
}
