/**
 * Data Aggregation Module for Correlation Discovery
 *
 * Aggregates quantified self metrics from multiple sources and aligns them
 * by date for correlation analysis.
 */

import { sql } from "../db/client";

export interface DailyMetrics {
  date: string; // ISO date string (YYYY-MM-DD)

  // Sleep & focus (from days table)
  sleepScore: number | null;
  focusMinutes: number | null;

  // Rituals (from rituals table)
  readingMinutes: number | null;
  outdoorMinutes: number | null;
  writingMinutes: number | null;

  // Coffee consumption (aggregated from coffee_log)
  coffeeCount: number | null;
  totalCaffeineMg: number | null;

  // Running (aggregated from runs)
  runDistanceKm: number | null;
  runDurationMin: number | null;

  // Workouts (from workouts table)
  workoutCount: number | null;
  workoutDurationMin: number | null;

  // Weather (from location_history, averaged per day)
  avgTempCelsius: number | null;
  avgHumidity: number | null;
  avgCloudiness: number | null;
  sunnyDay: boolean | null; // true if avg cloudiness < 30%

  // Subjective metrics (from subjective_metrics)
  mood: number | null;
  energy: number | null;
  stress: number | null;
  focusQuality: number | null;
}

export interface MetricDefinition {
  key: keyof DailyMetrics;
  label: string;
  description: string;
  unit?: string;
}

/**
 * All available metrics for correlation analysis
 */
export const AVAILABLE_METRICS: MetricDefinition[] = [
  { key: "sleepScore", label: "Sleep Score", description: "Sleep quality score (0-100)", unit: "points" },
  { key: "focusMinutes", label: "Focus Time", description: "Deep focus work time", unit: "minutes" },
  { key: "readingMinutes", label: "Reading Time", description: "Time spent reading", unit: "minutes" },
  { key: "outdoorMinutes", label: "Outdoor Time", description: "Time spent outdoors", unit: "minutes" },
  { key: "writingMinutes", label: "Writing Time", description: "Time spent writing", unit: "minutes" },
  { key: "coffeeCount", label: "Coffee Cups", description: "Number of coffee servings", unit: "cups" },
  { key: "totalCaffeineMg", label: "Caffeine Intake", description: "Total caffeine consumed", unit: "mg" },
  { key: "runDistanceKm", label: "Running Distance", description: "Distance ran", unit: "km" },
  { key: "runDurationMin", label: "Running Duration", description: "Time spent running", unit: "minutes" },
  { key: "workoutCount", label: "Workout Sessions", description: "Number of workout sessions", unit: "sessions" },
  { key: "workoutDurationMin", label: "Workout Duration", description: "Total workout time", unit: "minutes" },
  { key: "avgTempCelsius", label: "Temperature", description: "Average daily temperature", unit: "°C" },
  { key: "avgHumidity", label: "Humidity", description: "Average daily humidity", unit: "%" },
  { key: "avgCloudiness", label: "Cloudiness", description: "Average daily cloud cover", unit: "%" },
  { key: "sunnyDay", label: "Sunny Day", description: "Clear weather (cloudiness < 30%)", unit: "boolean" },
  { key: "mood", label: "Mood", description: "Daily mood rating (1-10)", unit: "score" },
  { key: "energy", label: "Energy", description: "Daily energy level (1-10)", unit: "score" },
  { key: "stress", label: "Stress", description: "Daily stress level (1-10)", unit: "score" },
  { key: "focusQuality", label: "Focus Quality", description: "Subjective focus quality (1-10)", unit: "score" },
];

/**
 * Fetch aggregated daily metrics for a date range
 * @param startDate Start date (inclusive)
 * @param endDate End date (inclusive)
 * @returns Array of daily metrics, one per date
 */
export async function fetchDailyMetrics(
  startDate: Date,
  endDate: Date
): Promise<DailyMetrics[]> {
  const startISO = startDate.toISOString().split("T")[0];
  const endISO = endDate.toISOString().split("T")[0];

  const rows = await sql`
    WITH date_range AS (
      SELECT generate_series(
        ${startISO}::date,
        ${endISO}::date,
        '1 day'::interval
      )::date AS date
    ),
    coffee_daily AS (
      SELECT
        date,
        COUNT(*) as coffee_count,
        -- Calculate caffeine based on brew type and amount
        -- Using approximate mg/ml rates per type (from lib/phys/caffeine.ts)
        SUM(
          CASE
            WHEN amount_ml IS NOT NULL THEN
              CASE type
                WHEN 'espresso' THEN amount_ml * 2.1
                WHEN 'v60' THEN amount_ml * 0.8
                WHEN 'chemex' THEN amount_ml * 0.8
                WHEN 'moka' THEN amount_ml * 1.6
                WHEN 'aero' THEN amount_ml * 1.1
                WHEN 'cold_brew' THEN amount_ml * 1.0
                ELSE amount_ml * 1.0
              END
            ELSE
              -- Default shot sizes when amount_ml is missing
              CASE type
                WHEN 'espresso' THEN 38 * 2.1
                WHEN 'v60' THEN 250 * 0.8
                WHEN 'chemex' THEN 300 * 0.8
                WHEN 'moka' THEN 60 * 1.6
                WHEN 'aero' THEN 200 * 1.1
                WHEN 'cold_brew' THEN 250 * 1.0
                ELSE 200 * 1.0
              END
          END
        ) as total_caffeine_mg
      FROM coffee_log
      WHERE date >= ${startISO}::date AND date <= ${endISO}::date
      GROUP BY date
    ),
    runs_daily AS (
      SELECT
        date,
        SUM((details->>'distance_km')::numeric) as run_distance_km,
        SUM(duration_min) as run_duration_min
      FROM workouts
      WHERE date >= ${startISO}::date
        AND date <= ${endISO}::date
        AND workout_type = 'running'
        AND details ? 'distance_km'
      GROUP BY date
    ),
    workouts_daily AS (
      SELECT
        date,
        COUNT(*) as workout_count,
        SUM(duration_min) as workout_duration_min
      FROM workouts
      WHERE date >= ${startISO}::date
        AND date <= ${endISO}::date
        AND workout_type != 'running' -- Exclude running, counted separately
      GROUP BY date
    ),
    weather_daily AS (
      SELECT
        logged_at::date as date,
        AVG(temp_celsius) as avg_temp_celsius,
        AVG(humidity) as avg_humidity,
        AVG(cloudiness) as avg_cloudiness
      FROM location_history
      WHERE logged_at::date >= ${startISO}::date
        AND logged_at::date <= ${endISO}::date
        AND temp_celsius IS NOT NULL
      GROUP BY logged_at::date
    )
    SELECT
      dr.date::text,
      d.sleep_score,
      d.focus_minutes,
      d.reading_minutes,
      d.outdoor_minutes,
      d.writing_minutes,
      c.coffee_count,
      c.total_caffeine_mg,
      ru.run_distance_km,
      ru.run_duration_min,
      w.workout_count,
      w.workout_duration_min,
      wd.avg_temp_celsius,
      wd.avg_humidity,
      wd.avg_cloudiness,
      CASE WHEN wd.avg_cloudiness < 30 THEN true ELSE false END as sunny_day,
      sm.mood,
      sm.energy,
      sm.stress,
      sm.focus_quality
    FROM date_range dr
    LEFT JOIN days d ON d.date = dr.date
    LEFT JOIN coffee_daily c ON c.date = dr.date
    LEFT JOIN runs_daily ru ON ru.date = dr.date
    LEFT JOIN workouts_daily w ON w.date = dr.date
    LEFT JOIN weather_daily wd ON wd.date = dr.date
    LEFT JOIN subjective_metrics sm ON sm.date = dr.date
    ORDER BY dr.date
  `;

  interface DbRow {
    date: string;
    sleep_score: number | null;
    focus_minutes: number | null;
    reading_minutes: number | null;
    outdoor_minutes: number | null;
    writing_minutes: number | null;
    coffee_count: number | null;
    total_caffeine_mg: number | null;
    run_distance_km: number | null;
    run_duration_min: number | null;
    workout_count: number | null;
    workout_duration_min: number | null;
    avg_temp_celsius: number | null;
    avg_humidity: number | null;
    avg_cloudiness: number | null;
    sunny_day: boolean | null;
    mood: number | null;
    energy: number | null;
    stress: number | null;
    focus_quality: number | null;
  }

  return rows.map((row) => {
    const r = row as DbRow;
    return {
      date: r.date,
      sleepScore: r.sleep_score,
      focusMinutes: r.focus_minutes,
      readingMinutes: r.reading_minutes,
      outdoorMinutes: r.outdoor_minutes,
      writingMinutes: r.writing_minutes,
      coffeeCount: Number(r.coffee_count) || null,
      totalCaffeineMg: Number(r.total_caffeine_mg) || null,
      runDistanceKm: r.run_distance_km ? Number(r.run_distance_km) : null,
      runDurationMin: r.run_duration_min ? Number(r.run_duration_min) : null,
      workoutCount: Number(r.workout_count) || null,
      workoutDurationMin: r.workout_duration_min ? Number(r.workout_duration_min) : null,
      avgTempCelsius: r.avg_temp_celsius ? Number(r.avg_temp_celsius) : null,
      avgHumidity: r.avg_humidity ? Number(r.avg_humidity) : null,
      avgCloudiness: r.avg_cloudiness ? Number(r.avg_cloudiness) : null,
      sunnyDay: r.sunny_day,
      mood: r.mood,
      energy: r.energy,
      stress: r.stress,
      focusQuality: r.focus_quality,
    };
  });
}

/**
 * Extract values for a specific metric across all days
 * Filters out null values and returns parallel arrays for dates and values
 */
export function extractMetricValues(
  data: DailyMetrics[],
  metric: keyof DailyMetrics
): { dates: string[]; values: number[] } {
  const dates: string[] = [];
  const values: number[] = [];

  for (const day of data) {
    const value = day[metric];

    // Skip null/undefined values and boolean (sunny_day)
    if (value === null || value === undefined || typeof value === "boolean") {
      continue;
    }

    dates.push(day.date);
    values.push(Number(value));
  }

  return { dates, values };
}

/**
 * Calculate minimum required sample size for meaningful correlation
 */
export function getMinimumSampleSize(): number {
  return 10; // Need at least 10 data points for meaningful correlation
}
