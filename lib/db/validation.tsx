import { z } from "zod";

export const ZDay = z.object({
  date: z.coerce.date(),
  sleep_score: z.coerce.number().int().min(0).max(100).optional(),
  focus_minutes: z.coerce.number().int().min(0).optional(),
  steps: z.coerce.number().int().min(0).optional(),
  reading_minutes: z.coerce.number().int().min(0).optional(),
  outdoor_minutes: z.coerce.number().int().min(0).optional(),
  writing_minutes: z.coerce.number().int().min(0).optional(),
  coding_minutes: z.coerce.number().int().min(0).optional(),
  journaled: z.coerce.boolean().optional(),
  extras: z.record(z.string(), z.number()).optional(),
});

export const ZRituals = z.object({
  date: z.coerce.date(),
  reading_minutes: z.coerce.number().int().min(0).optional(),
  outdoor_minutes: z.coerce.number().int().min(0).optional(),
  writing_minutes: z.coerce.number().int().min(0).optional(),
  steps: z.coerce.number().int().min(0).optional(),
  journaled: z.coerce.boolean().optional(),
  extras: z.record(z.string(), z.number()).optional(),
});

export const ZCoffee = z.object({
  date: z.coerce.date(),
  time: z.union([z.string(), z.coerce.date()]).optional(),
  type: z.enum(["espresso", "v60", "chemex", "moka", "aero", "cold_brew", "other"]),
  amount_ml: z.coerce.number().int().min(0).optional(),
  coffee_cf_id: z.string().min(1).optional(),    // Contentful Entry ID (if known)
});

export type TCoffee = z.infer<typeof ZCoffee>;

export const ZRun = z.object({
  date: z.coerce.date(),
  distance_km: z.coerce.number().min(0),
  duration_min: z.coerce.number().min(0),
  avg_pace_sec_per_km: z.coerce.number().int().min(0).optional(),
});

export const ZGoal = z.object({
  month: z.coerce.date(),
  kind: z.enum([
    "running_distance_km",
    "steps",
    "reading_minutes",
    "outdoor_minutes",
    "writing_minutes",
    "focus_minutes",
    "coding_minutes",
  ]),
  target: z.coerce.number().min(0),
});

export const ZBodyProfileRow = z.object({
  id: z.number().int(),
  weight_kg: z.number().positive(),
  height_cm: z.number().int().positive().nullable().optional(),
  vd_l_per_kg: z.number().positive().nullable().optional(),
  half_life_hours: z.number().positive().nullable().optional(),
  caffeine_sensitivity: z.number().positive().nullable().optional(),
  bioavailability: z.number().positive().max(1).nullable().optional(),
  updated_at: z.string(),
});

export const ZBodyProfileUpsert = z.object({
  weight_kg: z.coerce.number().positive().optional(),
  height_cm: z.coerce.number().int().positive().optional(),
  vd_l_per_kg: z.coerce.number().positive().optional(),
  half_life_hours: z.coerce.number().positive().optional(),
  caffeine_sensitivity: z.coerce.number().positive().optional(),
  bioavailability: z.coerce.number().positive().max(1).optional(),
});

export const ZDayUpsert = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sleep_score: z.coerce.number().int().min(0).max(100).optional(),
  focus_minutes: z.coerce.number().int().min(0).optional(),
  steps: z.coerce.number().int().min(0).optional(),
  reading_minutes: z.coerce.number().int().min(0).optional(),
  outdoor_minutes: z.coerce.number().int().min(0).optional(),
  writing_minutes: z.coerce.number().int().min(0).optional(),
  coding_minutes: z.coerce.number().int().min(0).optional(),
});

export const ZMonthlyGoalsUpsert = z.object({
  running_distance_km: z.coerce.number().min(0).optional(),
  steps: z.coerce.number().int().min(0).optional(),
  reading_minutes: z.coerce.number().int().min(0).optional(),
  outdoor_minutes: z.coerce.number().int().min(0).optional(),
  writing_minutes: z.coerce.number().int().min(0).optional(),
  coding_minutes: z.coerce.number().int().min(0).optional(),
  focus_minutes: z.coerce.number().int().min(0).optional(),
});