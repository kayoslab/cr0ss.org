// lib/phys/caffeine.ts
import type { BodyProfile } from "@/lib/user/profile";

/** A brew event from the DB. */
export type BrewEvent = {
  timeISO: string;                 // ISO timestamp (UTC)
  type: string;                    // espresso | v60 | moka | aero | cold_brew | other
  amount_ml?: number | null;       // poured amount if present
  mg?: number | null;              // explicit dose if available
};

export type CaffeineOptions = {
  halfLifeHours?: number;                 // override; else use body.half_life_hours or 5
  gridMinutes?: number;                   // resolution; if alignToHour=true and not set, defaults to 60
  mgPerMl?: Record<string, number>;       // dose density per type (mg/mL)
  defaultShotMl?: Record<string, number>; // fallback volume per type if amount_ml missing
  startMs?: number;                       // inclusive window start (ms since epoch)
  endMs?: number;                         // exclusive window end (ms since epoch)
  alignToHour?: boolean;                  // snap grid to :00 for start/end and steps
};

const LN2 = Math.log(2);

// Operational defaults; tweak if you calibrate later.
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
  espresso: 38,
  v60: 250,
  chemex: 300,
  moka: 60,
  aero: 200,
  cold_brew: 250,
  other: 200,
};

export type CaffeinePoint = {
  timeISO: string;
  intake_mg: number;       // mg consumed at this step (instantaneous bucket)
  body_mg: number;         // mg remaining in body after elimination
  blood_mg_per_l: number;  // modeled concentration (mg/L)
};

export function modelCaffeine(
  events: BrewEvent[],
  body: BodyProfile,
  opts: CaffeineOptions = {},
): CaffeinePoint[] {
  // ---- parameters
  const half_life_hours = (opts.halfLifeHours ?? body.half_life_hours ?? 5);
  const kPerMinute = LN2 / (half_life_hours * 60);

  const mgPerMl = { ...DEFAULT_MG_PER_ML, ...(opts.mgPerMl ?? {}) };
  const shotMl = { ...DEFAULT_SHOT_ML, ...(opts.defaultShotMl ?? {}) };

  const sensitivity = body.caffeine_sensitivity ?? 1.0; // 0.5..2
  const bioavailability = body.bioavailability ?? 0.9;  // 0..1

  const weight_kg = body.weight_kg || 75;
  const vd_l_per_kg = body.vd_l_per_kg ?? 0.6;
  const Vd_L = Math.max(1, vd_l_per_kg * Math.max(30, weight_kg)); // total distribution volume (L)

  // ---- normalize events and compute per-event dose (mg)
  const evts = [...events]
    .filter(e => e?.timeISO)
    .sort((a, b) => Date.parse(a.timeISO) - Date.parse(b.timeISO))
    .map(e => {
      const type = (e.type || "other") as string;
      const explicit = (typeof e.mg === "number" && e.mg > 0) ? e.mg : undefined;
      const fromAmount = (typeof e.amount_ml === "number" && e.amount_ml! > 0)
        ? e.amount_ml! * (mgPerMl[type] ?? mgPerMl.other)
        : undefined;
      const fallback = (shotMl[type] ?? shotMl.other) * (mgPerMl[type] ?? mgPerMl.other);
      const baseDose = (explicit ?? fromAmount ?? fallback);
      const doseMg = baseDose * bioavailability * sensitivity;
      return { t: Date.parse(e.timeISO), mg: doseMg };
    });

  // ---- window selection (prefer explicit bounds if provided)
  let endMs = typeof opts.endMs === "number" ? opts.endMs : Date.now();
  let startMs = typeof opts.startMs === "number" ? opts.startMs : (endMs - 24 * 60 * 60 * 1000);

  if (opts.alignToHour) {
    const s = new Date(startMs); s.setMinutes(0, 0, 0); startMs = s.getTime();
    const e = new Date(endMs);   e.setMinutes(0, 0, 0); endMs   = e.getTime();
  }

  // hourly grid when aligned; else default to 15-min
  const grid = Math.max(1, opts.gridMinutes ?? (opts.alignToHour ? 60 : 15));

  // ---- pre-bucket intake at grid resolution
  const stepMs = grid * 60 * 1000;
  const keyFor = (ms: number) => Math.floor((ms - startMs) / stepMs);
  const buckets = new Map<number, number>();
  for (const e of evts) {
    if (e.t < startMs || e.t >= endMs) continue;
    const key = keyFor(e.t);
    buckets.set(key, (buckets.get(key) ?? 0) + e.mg);
  }

  // ---- walk the grid (end-exclusive): produces exact number of steps
  const out: CaffeinePoint[] = [];
  for (let t = startMs, step = 0; t < endMs; t += stepMs, step++) {
    // sum decayed contributions from all prior doses
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
