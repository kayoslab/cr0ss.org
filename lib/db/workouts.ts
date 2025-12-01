import { sql } from "@/lib/db/client";
import { ZWorkout, ZWorkoutUpsert, type WorkoutUpsert } from "@/lib/db/validation";

/**
 * Get workouts within a date range, optionally filtered by type
 */
export async function getWorkoutsDB(
  startDate: Date,
  endDate: Date,
  workoutType?: string
) {
  const rows = workoutType
    ? await sql/*sql*/`
        SELECT
          id,
          date,
          workout_type,
          duration_min,
          intensity,
          perceived_effort,
          details,
          notes,
          created_at
        FROM workouts
        WHERE date >= ${startDate}
          AND date <= ${endDate}
          AND workout_type = ${workoutType}
        ORDER BY date DESC
      `
    : await sql/*sql*/`
        SELECT
          id,
          date,
          workout_type,
          duration_min,
          intensity,
          perceived_effort,
          details,
          notes,
          created_at
        FROM workouts
        WHERE date >= ${startDate}
          AND date <= ${endDate}
        ORDER BY date DESC
      `;

  return rows.map(r => ({
    id: Number(r.id),
    date: new Date(r.date),
    workout_type: r.workout_type,
    duration_min: Number(r.duration_min),
    intensity: r.intensity || undefined,
    perceived_effort: r.perceived_effort === null ? undefined : Number(r.perceived_effort),
    details: r.details || undefined,
    notes: r.notes || undefined,
    created_at: new Date(r.created_at).toISOString(),
  }));
}

/**
 * Insert a new workout
 */
export async function insertWorkoutDB(workout: WorkoutUpsert) {
  const parsed = ZWorkoutUpsert.parse(workout);

  const rows = await sql/*sql*/`
    INSERT INTO workouts (
      date,
      workout_type,
      duration_min,
      intensity,
      perceived_effort,
      details,
      notes
    ) VALUES (
      ${parsed.date},
      ${parsed.workout_type},
      ${parsed.duration_min},
      ${parsed.intensity ?? null}::varchar,
      ${parsed.perceived_effort ?? null}::integer,
      ${parsed.details ? JSON.stringify(parsed.details) : null}::jsonb,
      ${parsed.notes ?? null}::text
    )
    RETURNING
      id,
      date,
      workout_type,
      duration_min,
      intensity,
      perceived_effort,
      details,
      notes,
      created_at
  `;

  const r = rows[0];
  const out = {
    id: Number(r.id),
    date: new Date(r.date),
    workout_type: r.workout_type,
    duration_min: Number(r.duration_min),
    intensity: r.intensity || undefined,
    perceived_effort: r.perceived_effort === null ? undefined : Number(r.perceived_effort),
    details: r.details || undefined,
    notes: r.notes || undefined,
    created_at: new Date(r.created_at).toISOString(),
  };

  return ZWorkout.parse(out);
}

/**
 * Get a specific workout by ID
 */
export async function getWorkoutByIdDB(id: number) {
  const rows = await sql/*sql*/`
    SELECT
      id,
      date,
      workout_type,
      duration_min,
      distance_km,
      elevation_gain_m,
      intensity,
      perceived_effort,
      details,
      notes,
      created_at
    FROM workouts
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!rows[0]) {
    throw new Error(`Workout with id ${id} not found`);
  }

  const r = rows[0];
  const out = {
    id: Number(r.id),
    date: new Date(r.date),
    workout_type: r.workout_type,
    duration_min: Number(r.duration_min),
    intensity: r.intensity || undefined,
    perceived_effort: r.perceived_effort === null ? undefined : Number(r.perceived_effort),
    details: r.details || undefined,
    notes: r.notes || undefined,
    created_at: new Date(r.created_at).toISOString(),
  };

  return ZWorkout.parse(out);
}

/**
 * Get recent workouts (last N entries)
 */
export async function getRecentWorkoutsDB(limit: number = 30) {
  const rows = await sql/*sql*/`
    SELECT
      id,
      date,
      workout_type,
      duration_min,
      distance_km,
      elevation_gain_m,
      intensity,
      perceived_effort,
      details,
      notes,
      created_at
    FROM workouts
    ORDER BY date DESC, created_at DESC
    LIMIT ${limit}
  `;

  return rows.map(r => ({
    id: Number(r.id),
    date: new Date(r.date),
    workout_type: r.workout_type,
    duration_min: Number(r.duration_min),
    intensity: r.intensity || undefined,
    perceived_effort: r.perceived_effort === null ? undefined : Number(r.perceived_effort),
    details: r.details || undefined,
    notes: r.notes || undefined,
    created_at: new Date(r.created_at).toISOString(),
  }));
}

/**
 * Get workouts by type (last N entries)
 */
export async function getWorkoutsByTypeDB(workoutType: string, limit: number = 30) {
  const rows = await sql/*sql*/`
    SELECT
      id,
      date,
      workout_type,
      duration_min,
      distance_km,
      elevation_gain_m,
      intensity,
      perceived_effort,
      details,
      notes,
      created_at
    FROM workouts
    WHERE workout_type = ${workoutType}
    ORDER BY date DESC, created_at DESC
    LIMIT ${limit}
  `;

  return rows.map(r => ({
    id: Number(r.id),
    date: new Date(r.date),
    workout_type: r.workout_type,
    duration_min: Number(r.duration_min),
    intensity: r.intensity || undefined,
    perceived_effort: r.perceived_effort === null ? undefined : Number(r.perceived_effort),
    details: r.details || undefined,
    notes: r.notes || undefined,
    created_at: new Date(r.created_at).toISOString(),
  }));
}

/**
 * Get total distance for a specific workout type in a date range
 * Useful for calculating monthly running distance, cycling distance, etc.
 * Note: Distance is now stored in details JSONB field
 */
export async function getTotalDistanceDB(
  workoutType: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const rows = await sql/*sql*/`
    SELECT COALESCE(SUM((details->>'distance_km')::numeric), 0) as total_distance
    FROM workouts
    WHERE workout_type = ${workoutType}
      AND date >= ${startDate}
      AND date <= ${endDate}
      AND details ? 'distance_km'
  `;

  return Number(rows[0]?.total_distance || 0);
}
