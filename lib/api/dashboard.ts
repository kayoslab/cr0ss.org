import { z } from "zod";

export const ZBrewMethodToday = z.object({
  type: z.string(),
  count: z.number(),
});

export const ZNameValue = z.object({
  name: z.string(),
  value: z.number(),
});

export const ZHabitsToday = z.object({
  steps: z.number(),
  reading_minutes: z.number(),
  outdoor_minutes: z.number(),
  writing_minutes: z.number(),
  coding_minutes: z.number(),
  focus_minutes: z.number(),
});

export const ZConsistency = z.object({
  name: z.string(),
  kept: z.number(),
  total: z.number(),
});

export const ZWritingVsFocus = z.object({
  date: z.string(), // YYYY-MM-DD
  writing_minutes: z.number(),
  focus_minutes: z.number(),
});

export const ZRunningProgress = z.object({
  target_km: z.number(),
  total_km: z.number(),
  delta_km: z.number(),
  pct: z.number(),
  month: z.string(), // YYYY-MM-01
});

export const ZPacePoint = z.object({
  date: z.string(),            // YYYY-MM-DD
  avg_pace_sec_per_km: z.number(), // raw seconds
});

export const ZHeat = z.object({
  date: z.string(),
  km: z.number(),
});

export const ZCaffeinePoint = z.object({
  timeISO: z.string(), // ISO timestamp
  intake_mg: z.number(),
  body_mg: z.number(),
});

export const ZSleepPrev = z.object({
  date: z.string(),
  sleep_score: z.number(),
  prev_caffeine_mg: z.number(),
});

export const ZMonthlyGoals = z.object({
  steps: z.number().default(0),
  running_distance_km: z.number().default(0),
  reading_minutes: z.number().default(0),
  outdoor_minutes: z.number().default(0),
  writing_minutes: z.number().default(0),
  coding_minutes: z.number().default(0),
  focus_minutes: z.number().default(0),
}).default({
  steps: 0,
  running_distance_km: 0,
  reading_minutes: 0,
  outdoor_minutes: 0,
  writing_minutes: 0,
  coding_minutes: 0,
  focus_minutes: 0,
});

export const ZDashboard = z.object({
  cupsToday: z.number(),
  brewMethodsToday: z.array(ZBrewMethodToday),
  coffeeOriginThisWeek: z.array(ZNameValue),
  habitsToday: ZHabitsToday,
  habitsConsistency: z.array(ZConsistency),
  writingVsFocus: z.array(ZWritingVsFocus),
  runningProgress: ZRunningProgress,
  paceSeries: z.array(ZPacePoint),
  runningHeatmap: z.array(ZHeat),
  caffeineSeries: z.array(ZCaffeinePoint),
  sleepPrevCaff: z.array(ZSleepPrev),
  monthlyGoals: ZMonthlyGoals, // must be present
});

export type DashboardResponse = z.infer<typeof ZDashboard>;
