import type { BodyProfile } from "@/lib/user/profile";

// A brew event we get from the DB
export type BrewEvent = {
  timeISO: string;        // ISO timestamp (UTC)
  type: string;           // espresso | v60 | chemex | moka | aero | cold_brew | other
  amount_ml?: number | null;
  mg?: number | null;     // explicit dose if available (not required)
};

// Modeling options
export type CaffeineOptions = {
  halfLifeHours?: number;                // if not provided, use body.halfLifeHours or 5
  gridMinutes?: number;                  // resolution (default 15)
  mgPerMl?: Record<string, number>;      // dose density per type (mg per mL)
  defaultShotMl?: Record<string, number>;// fallback volume per type if amount_ml is missing
};

const LN2 = Math.log(2);

// Rough-but-reasonable defaults (tune later if you like)
// Sources vary; these are *operational* estimates.
// Example: espresso ~ 2.1 mg/mL (≈ 63 mg per 30 mL single shot)
export const DEFAULT_MG_PER_ML: Record<string, number> = {
  espresso: 2.1,
  v60: 0.8,
  chemex: 0.8,
  moka: 1.6,
  aero: 1.1,
  cold_brew: 1.0,
  other: 1.0,
};

// Fallback volumes if amount_ml is missing
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
  intake_mg: number;          // mg consumed at this grid step
  body_mg: number;            // mg still in body (after elimination)
  blood_mg_per_l: number;     // modeled plasma concentration (mg/L)
};

export function modelCaffeine(
  events: BrewEvent[],
  body: BodyProfile,
  opts: CaffeineOptions = {},
): CaffeinePoint[] {
  const grid = Math.max(1, opts.gridMinutes ?? 15);
  const halfLife = (opts.halfLifeHours ?? body.halfLifeHours ?? 5);
  const kPerMinute = LN2 / (halfLife * 60); // elimination rate
  const mgPerMl = { ...DEFAULT_MG_PER_ML, ...(opts.mgPerMl ?? {}) };
  const shotMl = { ...DEFAULT_SHOT_ML, ...(opts.defaultShotMl ?? {}) };
  const sensitivity = body.caffeine_sensitivity ?? 1.0;
  const F = body.bioavailability ?? 0.9; // fraction absorbed

  // total distribution volume in liters (for concentration)
  const Vd_L = Math.max(1, (body.vd_L_per_kg ?? 0.6) * Math.max(30, body.weight_kg || 75));

  // Normalize & sort events
  const evts = [...events]
    .filter(e => e?.timeISO)
    .sort((a, b) => Date.parse(a.timeISO) - Date.parse(b.timeISO))
    .map(e => {
      const type = (e.type || "other") as string;
      // dose precedence: explicit mg -> amount_ml * mg/ml -> default volume * mg/ml
      const doseMg =
        (typeof e.mg === "number" && e.mg > 0 ? e.mg :
        (typeof e.amount_ml === "number" && e.amount_ml! > 0
            ? e.amount_ml! * (mgPerMl[type] ?? mgPerMl.other)
            : (shotMl[type] ?? shotMl.other) * (mgPerMl[type] ?? mgPerMl.other)
        )) * F * sensitivity;

      return { t: Date.parse(e.timeISO), mg: doseMg };
    });

  // Build a 24h window ending now
  const now = Date.now();
  const start = now - 24 * 60 * 60 * 1000;

  // Pre-bucket intake (instantaneous at the nearest grid)
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
    let bodyMg = 0;
    for (const e of evts) {
      if (e.t > t) break;
      const dtMin = (t - e.t) / (60 * 1000);
      const remaining = e.mg * Math.exp(-kPerMinute * dtMin);
      bodyMg += remaining;
    }
    const intake = buckets.get(step) ?? 0;
    out.push({
      timeISO: new Date(t).toISOString(),
      intake_mg: Math.round(intake),
      body_mg: Math.round(bodyMg),
      blood_mg_per_l: bodyMg / Vd_L,
    });
  }
  return out;
}
