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

// Legacy run schema (deprecated - use ZWorkout instead)
export const ZRun = z.object({
  date: z.coerce.date(),
  distance_km: z.coerce.number().min(0),
  duration_min: z.coerce.number().min(0),
  avg_pace_sec_per_km: z.coerce.number().int().min(0).optional(),
});

// Workout types
export const WorkoutType = z.enum([
  'running',
  'climbing',
  'bouldering',
  'rowing',
  'cycling',
  'hiking',
  'strength',
  'other',
]);

export const WorkoutIntensity = z.enum(['low', 'moderate', 'high', 'max']);

// Workout source (manual entry or external integration)
export const WorkoutSource = z.enum(['manual', 'strava']);

// Unified workout schema
export const ZWorkout = z.object({
  id: z.number().int().optional(),
  date: z.coerce.date(),
  workout_type: WorkoutType,
  duration_min: z.coerce.number().int().positive(),
  intensity: WorkoutIntensity.optional(),
  perceived_effort: z.coerce.number().int().min(1).max(10).optional(),
  details: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional(),
  created_at: z.string().optional(),

  // Strava integration fields
  source: WorkoutSource.optional(),
  external_id: z.string().optional(),
  synced_at: z.string().optional(),
});

export const ZWorkoutUpsert = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  workout_type: WorkoutType,
  duration_min: z.coerce.number().int().positive(),
  intensity: WorkoutIntensity.optional(),
  perceived_effort: z.coerce.number().int().min(1).max(10).optional(),
  details: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional(),

  // Strava integration fields
  source: WorkoutSource.optional(),
  external_id: z.string().optional(),
});

export type Workout = z.infer<typeof ZWorkout>;
export type WorkoutUpsert = z.infer<typeof ZWorkoutUpsert>;

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
  period: z.enum(["monthly", "daily"]),
});

export const ZSubjectiveMetrics = z.object({
  date: z.coerce.date(),
  mood: z.coerce.number().int().min(1).max(10).optional(),
  energy: z.coerce.number().int().min(1).max(10).optional(),
  stress: z.coerce.number().int().min(1).max(10).optional(),
  focus_quality: z.coerce.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
});

export type SubjectiveMetrics = z.infer<typeof ZSubjectiveMetrics>;

export const ZBodyProfileRow = z.object({
  id: z.number().int(),
  measured_at: z.string(),
  weight_kg: z.number().positive(),
  height_cm: z.number().int().positive().nullable().optional(),
  body_fat_percentage: z.number().min(0).max(100).nullable().optional(),
  muscle_percentage: z.number().min(0).max(100).nullable().optional(),
  vd_l_per_kg: z.number().positive().nullable().optional(),
  half_life_hours: z.number().positive().nullable().optional(),
  caffeine_sensitivity: z.number().positive().nullable().optional(),
  bioavailability: z.number().positive().max(1).nullable().optional(),
  age: z.number().int().positive().max(150).nullable().optional(),
  sex: z.enum(['male', 'female', 'other']).nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
});

export const ZBodyProfileUpsert = z.object({
  measured_at: z.coerce.date().optional(),
  weight_kg: z.coerce.number().positive().optional(),
  height_cm: z.coerce.number().int().positive().optional(),
  body_fat_percentage: z.coerce.number().min(0).max(100).optional(),
  muscle_percentage: z.coerce.number().min(0).max(100).optional(),
  vd_l_per_kg: z.coerce.number().positive().optional(),
  half_life_hours: z.coerce.number().positive().optional(),
  caffeine_sensitivity: z.coerce.number().positive().optional(),
  bioavailability: z.coerce.number().positive().max(1).optional(),
  age: z.coerce.number().int().positive().max(150).optional(),
  sex: z.enum(['male', 'female', 'other']).optional(),
  notes: z.string().optional(),
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

// Individual goal with value and period
const ZGoalInput = z.object({
  target: z.coerce.number().min(0),
  period: z.enum(["monthly", "daily"]),
});

export const ZMonthlyGoalsUpsert = z.object({
  running_distance_km: z.union([z.coerce.number().min(0), ZGoalInput]).optional(),
  steps: z.union([z.coerce.number().int().min(0), ZGoalInput]).optional(),
  reading_minutes: z.union([z.coerce.number().int().min(0), ZGoalInput]).optional(),
  outdoor_minutes: z.union([z.coerce.number().int().min(0), ZGoalInput]).optional(),
  writing_minutes: z.union([z.coerce.number().int().min(0), ZGoalInput]).optional(),
  coding_minutes: z.union([z.coerce.number().int().min(0), ZGoalInput]).optional(),
  focus_minutes: z.union([z.coerce.number().int().min(0), ZGoalInput]).optional(),
});

// ===== Strava Integration Schemas =====

// Strava OAuth token response
export const ZStravaTokenResponse = z.object({
  token_type: z.string(),
  expires_at: z.number(),
  expires_in: z.number(),
  refresh_token: z.string(),
  access_token: z.string(),
  athlete: z.object({
    id: z.number(),
    username: z.string().optional(),
    firstname: z.string().optional(),
    lastname: z.string().optional(),
  }),
});

// Strava webhook event
export const ZStravaWebhookEvent = z.object({
  object_type: z.enum(['activity', 'athlete']),
  object_id: z.number(),
  aspect_type: z.enum(['create', 'update', 'delete']),
  updates: z.record(z.string(), z.boolean()).optional(),
  owner_id: z.number(),
  subscription_id: z.number(),
  event_time: z.number(),
});

// Strava activity (simplified - only fields we care about)
export const ZStravaActivity = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  start_date: z.string(),
  start_date_local: z.string(),
  timezone: z.string(),
  distance: z.number(),
  moving_time: z.number(),
  elapsed_time: z.number(),
  total_elevation_gain: z.number(),

  // Optional metrics
  average_speed: z.number().optional(),
  max_speed: z.number().optional(),
  average_heartrate: z.number().optional(),
  max_heartrate: z.number().optional(),
  average_cadence: z.number().optional(),
  elev_high: z.number().optional(),
  elev_low: z.number().optional(),
  description: z.string().optional(),
  kudos_count: z.number().optional(),
  private: z.boolean().optional(),
});

export type StravaTokenResponse = z.infer<typeof ZStravaTokenResponse>;
export type StravaWebhookEvent = z.infer<typeof ZStravaWebhookEvent>;
export type StravaActivity = z.infer<typeof ZStravaActivity>;