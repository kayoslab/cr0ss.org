import { neon } from "@neondatabase/serverless";
import { ZBodyProfileRow, ZBodyProfileUpsert } from "@/lib/db/validation";
import { z } from "zod";

const sql = neon(process.env.DATABASE_URL!);

/**
 * Get the most recent body profile entry
 */
export async function getBodyProfileDB() {
  const rows = await sql/*sql*/`
    SELECT
      id,
      measured_at,
      weight_kg,
      height_cm,
      body_fat_percentage,
      muscle_percentage,
      vd_l_per_kg,
      half_life_hours,
      caffeine_sensitivity,
      bioavailability,
      age,
      sex,
      notes,
      created_at
    FROM body_profile
    ORDER BY measured_at DESC
    LIMIT 1
  `;

  if (!rows[0]) {
    throw new Error("No body profile data found. Please create an initial entry.");
  }

  // Neon returns numeric as strings; normalize to numbers
  const r = rows[0];
  const out = {
    id: Number(r.id),
    measured_at: new Date(r.measured_at).toISOString(),
    weight_kg: Number(r.weight_kg),
    height_cm: r.height_cm === null ? null : Number(r.height_cm),
    body_fat_percentage: r.body_fat_percentage === null ? null : Number(r.body_fat_percentage),
    muscle_percentage: r.muscle_percentage === null ? null : Number(r.muscle_percentage),
    vd_l_per_kg: r.vd_l_per_kg === null ? null : Number(r.vd_l_per_kg),
    half_life_hours: r.half_life_hours === null ? null : Number(r.half_life_hours),
    caffeine_sensitivity: r.caffeine_sensitivity === null ? null : Number(r.caffeine_sensitivity),
    bioavailability: r.bioavailability === null ? null : Number(r.bioavailability),
    age: r.age === null ? null : Number(r.age),
    sex: r.sex === null ? null : String(r.sex),
    notes: r.notes === null ? null : String(r.notes),
    created_at: new Date(r.created_at).toISOString(),
  };

  return ZBodyProfileRow.parse(out);
}

/**
 * Insert a new body profile measurement
 * Creates a historical record
 */
export async function upsertBodyProfileDB(p: Partial<z.infer<typeof ZBodyProfileUpsert>>) {
  const measuredAt = p.measured_at ? new Date(p.measured_at) : new Date();

  const rows = await sql/*sql*/`
    INSERT INTO body_profile (
      measured_at,
      weight_kg,
      height_cm,
      body_fat_percentage,
      muscle_percentage,
      vd_l_per_kg,
      half_life_hours,
      caffeine_sensitivity,
      bioavailability,
      age,
      sex,
      notes
    ) VALUES (
      ${measuredAt},
      ${p.weight_kg ?? null}::numeric,
      ${p.height_cm ?? null}::integer,
      ${p.body_fat_percentage ?? null}::numeric,
      ${p.muscle_percentage ?? null}::numeric,
      ${p.vd_l_per_kg ?? null}::numeric,
      ${p.half_life_hours ?? null}::numeric,
      ${p.caffeine_sensitivity ?? null}::numeric,
      ${p.bioavailability ?? null}::numeric,
      ${p.age ?? null}::integer,
      ${p.sex ?? null}::varchar,
      ${p.notes ?? null}::text
    )
    RETURNING
      id,
      measured_at,
      weight_kg,
      height_cm,
      body_fat_percentage,
      muscle_percentage,
      vd_l_per_kg,
      half_life_hours,
      caffeine_sensitivity,
      bioavailability,
      age,
      sex,
      notes,
      created_at
  `;

  const r = rows[0];
  const out = {
    id: Number(r.id),
    measured_at: new Date(r.measured_at).toISOString(),
    weight_kg: Number(r.weight_kg),
    height_cm: r.height_cm === null ? null : Number(r.height_cm),
    body_fat_percentage: r.body_fat_percentage === null ? null : Number(r.body_fat_percentage),
    muscle_percentage: r.muscle_percentage === null ? null : Number(r.muscle_percentage),
    vd_l_per_kg: r.vd_l_per_kg === null ? null : Number(r.vd_l_per_kg),
    half_life_hours: r.half_life_hours === null ? null : Number(r.half_life_hours),
    caffeine_sensitivity: r.caffeine_sensitivity === null ? null : Number(r.caffeine_sensitivity),
    bioavailability: r.bioavailability === null ? null : Number(r.bioavailability),
    age: r.age === null ? null : Number(r.age),
    sex: r.sex === null ? null : String(r.sex),
    notes: r.notes === null ? null : String(r.notes),
    created_at: new Date(r.created_at).toISOString(),
  };

  return ZBodyProfileRow.parse(out);
}

/**
 * Get body profile history (last N entries)
 */
export async function getBodyProfileHistoryDB(limit: number = 30) {
  const rows = await sql/*sql*/`
    SELECT
      id,
      measured_at,
      weight_kg,
      body_fat_percentage,
      muscle_percentage,
      created_at
    FROM body_profile
    ORDER BY measured_at DESC
    LIMIT ${limit}
  `;

  return rows.map(r => ({
    id: Number(r.id),
    measured_at: new Date(r.measured_at).toISOString(),
    weight_kg: Number(r.weight_kg),
    body_fat_percentage: r.body_fat_percentage === null ? null : Number(r.body_fat_percentage),
    muscle_percentage: r.muscle_percentage === null ? null : Number(r.muscle_percentage),
    created_at: new Date(r.created_at).toISOString(),
  }));
}
