import { z } from "zod";
import { env } from '@/env';

export const HeadersSecret = (req: Request) => {
  const h = new Headers(req.headers);
  const key = h.get("x-vercel-revalidation-key");
  if (key !== env.DASHBOARD_API_SECRET) {
    throw new Response(JSON.stringify({ message: "Invalid secret" }), { status: 401 });
  }
};

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
  time: z.string().optional(),
  type: z.enum(["espresso", "v60", "moka", "aero", "cold_brew", "other"]),
  amount_ml: z.coerce.number().int().min(0).optional(),
  coffee_cf_id: z.string().min(1).optional(),    // Contentful Entry ID (if known)
});


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
