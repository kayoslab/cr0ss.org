// lib/phys/caffeine.ts
import type { BodyProfile } from "@/lib/user/profile";

// A brew event we get from the DB
export type BrewEvent = {
  timeISO: string;                 // ISO timestamp (UTC)
  type: string;                    // espresso | v60 | moka | aero | cold_brew | other
  amount_ml?: number | null;       // poured amount if present
  mg?: number | null;              // explicit dose if available (optional)
};

// Modeling options
export type CaffeineOptions = {
  halfLifeHours?: number;                 // explicit override; otherwise uses body.half_life_hours or 5
  gridMinutes?: number;                   // resolution (default 15)
  mgPerMl?: Record<string, number>;       // dose density per type (mg per mL)
  defaultShotMl?: Record<string, number>; // fallback volume per type if amount_ml is missing
};

const LN2 = Math.log(2);

// Operational defaults; tune if you calibrate later
export const DEFAULT_MG_PER_ML: Record<string, number> = {
  espresso: 2.1,
  v60: 0.8,
  chemex: 0.8,
  moka: 1.6,
  aero: 1.1,
  cold_brew: 1.0,
  other: 1.0,
};

export const DEFAULT_SHOT_ML: Record<string, number> = {
  espresso: 30,
  v60: 250,
  chemex: 300,
  moka: 60,
  aero: 220,
  cold_brew: 250,
  other: 200,
};

export type CaffeinePoint = {
  timeISO: string;
  intake_mg: number;       // mg consumed at this grid step
  body_mg: number;         // mg remaining in body after elimination
  blood_mg_per_l: number;  // modeled concentration (mg/L)
};

export function modelCaffeine(
  events: BrewEvent[],
  body: BodyProfile,
  opts: CaffeineOptions = {},
): CaffeinePoint[] {
  const grid = Math.max(1, opts.gridMinutes ?? 15);

  // Use explicit override -> body -> default
  const half_life_hours = (opts.halfLifeHours ?? body.half_life_hours ?? 5);
  const kPerMinute = LN2 / (half_life_hours * 60);

  const mgPerMl = { ...DEFAULT_MG_PER_ML, ...(opts.mgPerMl ?? {}) };
  const shotMl = { ...DEFAULT_SHOT_ML, ...(opts.defaultShotMl ?? {}) };

  const sensitivity = body.caffeine_sensitivity ?? 1.0; // 0.5..2
  const bioavailability = body.bioavailability ?? 0.9;  // 0..1

  // Total distribution volume in liters for concentration
  const weight_kg = body.weight_kg || 75;
  const vd_l_per_kg = body.vd_l_per_kg ?? 0.6;
  const Vd_L = Math.max(1, vd_l_per_kg * Math.max(30, weight_kg));

  // Normalize & sort events
  const evts = [...events]
    .filter(e => e?.timeISO)
    .sort((a, b) => Date.parse(a.timeISO) - Date.parse(b.timeISO))
    .map(e => {
      const type = (e.type || "other") as string;
      // dose precedence: explicit mg -> amount_ml × mg/ml[type] -> default volume × mg/ml[type]
      const baseDose =
        (typeof e.mg === "number" && e.mg > 0)
          ? e.mg
          : (typeof e.amount_ml === "number" && e.amount_ml! > 0)
              ? e.amount_ml! * (mgPerMl[type] ?? mgPerMl.other)
              : (shotMl[type] ?? shotMl.other) * (mgPerMl[type] ?? mgPerMl.other);

      const doseMg = baseDose * bioavailability * sensitivity;
      return { t: Date.parse(e.timeISO), mg: doseMg };
    });

  // Build a 24h window ending now
  const now = Date.now();
  const start = now - 24 * 60 * 60 * 1000;

  // Pre-bucket intake at grid resolution
  const bucketKey = (ms: number) => Math.floor((ms - start) / (grid * 60 * 1000));
  const buckets = new Map<number, number>();
  for (const e of evts) {
    if (e.t < start || e.t > now) continue;
    const key = bucketKey(e.t);
    buckets.set(key, (buckets.get(key) ?? 0) + e.mg);
  }

  const out: CaffeinePoint[] = [];
  for (let t = start, step = 0; t <= now; t += grid * 60 * 1000, step++) {
    // Sum decayed contributions from all prior doses
    let body_mg = 0;
    for (const e of evts) {
      if (e.t > t) break;
      const dtMin = (t - e.t) / (60 * 1000);
      const remaining = e.mg * Math.exp(-kPerMinute * dtMin);
      body_mg += remaining;
    }
    const intake_mg = buckets.get(step) ?? 0;
    out.push({
      timeISO: new Date(t).toISOString(),
      intake_mg: Math.round(intake_mg),
      body_mg: Math.round(body_mg),
      blood_mg_per_l: body_mg / Vd_L,
    });
  }
  return out;
}
