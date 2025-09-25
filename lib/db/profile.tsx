import { neon } from "@neondatabase/serverless";
import { ZBodyProfileRow } from "@/lib/db/validation";

const sql = neon(process.env.DATABASE_URL!);

export async function getBodyProfileDB() {
  const rows = await sql/*sql*/`select id, weight_kg, height_cm, vd_l_per_kg, half_life_hours, caffeine_sensitivity, bioavailability, updated_at
                                from body_profile where id = 1`;
  if (!rows[0]) throw new Error("body_profile row missing");
  // Neon returns numeric as strings; normalize to numbers
  const r = rows[0];
  const out = {
    id: 1,
    weight_kg: Number(r.weight_kg),
    height_cm: r.height_cm === null ? null : Number(r.height_cm),
    vd_l_per_kg: r.vd_l_per_kg === null ? null : Number(r.vd_l_per_kg),
    half_life_hours: r.half_life_hours === null ? null : Number(r.half_life_hours),
    caffeine_sensitivity: r.caffeine_sensitivity === null ? null : Number(r.caffeine_sensitivity),
    bioavailability: r.bioavailability === null ? null : Number(r.bioavailability),
    updated_at: new Date(r.updated_at).toISOString(),
  };
  return ZBodyProfileRow.parse(out);
}

export async function upsertBodyProfileDB(p: Partial<Zod.infer<typeof ZBodyProfileRow>>) {
  const rows = await sql/*sql*/`
    UPDATE body_profile SET
      weight_kg = COALESCE(${p.weight_kg ?? null}, weight_kg),
      height_cm = COALESCE(${p.height_cm ?? null}, height_cm),
      vd_l_per_kg = COALESCE(${p.vd_l_per_kg ?? null}, vd_l_per_kg),
      half_life_hours = COALESCE(${p.half_life_hours ?? null}, half_life_hours),
      caffeine_sensitivity = COALESCE(${p.caffeine_sensitivity ?? null}, caffeine_sensitivity),
      bioavailability = COALESCE(${p.bioavailability ?? null}, bioavailability),
      updated_at = now()
    WHERE id = 1
    RETURNING id, weight_kg, height_cm, vd_l_per_kg, half_life_hours, caffeine_sensitivity, bioavailability, updated_at
  `;
  const r = rows[0];
  const out = {
    id: 1,
    weight_kg: Number(r.weight_kg),
    height_cm: r.height_cm === null ? null : Number(r.height_cm),
    vd_l_per_kg: r.vd_l_per_kg === null ? null : Number(r.vd_l_per_kg),
    half_life_hours: r.half_life_hours === null ? null : Number(r.half_life_hours),
    caffeine_sensitivity: r.caffeine_sensitivity === null ? null : Number(r.caffeine_sensitivity),
    bioavailability: r.bioavailability === null ? null : Number(r.bioavailability),
    updated_at: new Date(r.updated_at).toISOString(),
  };
  return ZBodyProfileRow.parse(out);
}
