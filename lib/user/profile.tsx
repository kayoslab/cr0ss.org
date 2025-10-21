// lib/user/profile.ts
import { getBodyProfileDB } from "@/lib/db/profile";

export type BodyProfile = {
  weight_kg: number;
  height_cm?: number | null;
  body_fat_percentage?: number | null;
  muscle_percentage?: number | null;
  vd_l_per_kg?: number | null;
  half_life_hours?: number | null;
  caffeine_sensitivity?: number | null;
  bioavailability?: number | null;
  age?: number | null;
  sex?: string | null;
};


function envNum(s: string | undefined) {
  const n = s ? Number(s) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function envFallback(): BodyProfile {
  return {
    weight_kg: envNum(process.env.BODY_WEIGHT_KG) ?? 75,
    height_cm: envNum(process.env.BODY_HEIGHT_CM) ?? 180,
    vd_l_per_kg: envNum(process.env.BODY_VD_L_PER_KG) ?? 0.6,
    half_life_hours: envNum(process.env.BODY_HALF_LIFE_H) ?? 5,
    caffeine_sensitivity: envNum(process.env.BODY_CAFFEINE_SENSITIVITY) ?? 1.0,
    bioavailability: envNum(process.env.BODY_BIOAVAILABILITY) ?? 0.9,
  };
}

export async function getBodyProfile(): Promise<BodyProfile> {
  try {
    const db = await getBodyProfileDB();
    return {
      weight_kg: db.weight_kg,
      height_cm: db.height_cm ?? undefined,
      body_fat_percentage: db.body_fat_percentage ?? undefined,
      muscle_percentage: db.muscle_percentage ?? undefined,
      vd_l_per_kg: db.vd_l_per_kg ?? undefined,
      half_life_hours: db.half_life_hours ?? undefined,
      caffeine_sensitivity: db.caffeine_sensitivity ?? undefined,
      bioavailability: db.bioavailability ?? undefined,
      age: db.age ?? undefined,
      sex: db.sex ?? undefined,
    };
  } catch {
    return envFallback();
  }
}
