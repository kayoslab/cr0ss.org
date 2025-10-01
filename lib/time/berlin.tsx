// Single-source Berlin timezone helpers (robust across DST)
const BERLIN_TZ = "Europe/Berlin";

// --- HH:mm helpers (24h, tolerant input) -----------------------------

/** Parse a loose "HH:mm" (also accepts "H", "H:", "H:m") into clamped {hh,mm}. */
export function parseHHmm(raw: string): { hh: number; mm: number } {
  const s = String(raw ?? "").trim();
  const m = /^(\d{1,2})(?::?(\d{1,2}))?$/.exec(s);
  if (!m) return { hh: 0, mm: 0 };
  let hh = Number(m[1] ?? 0);
  let mm = Number(m[2] ?? 0);
  if (!Number.isFinite(hh)) hh = 0;
  if (!Number.isFinite(mm)) mm = 0;
  hh = Math.max(0, Math.min(23, Math.floor(hh)));
  mm = Math.max(0, Math.min(59, Math.floor(mm)));
  return { hh, mm };
}

/** Return normalized "HH:mm" (24h) string. Tolerates partial or fuzzy input. */
export function normalizeHHmm(raw: string): string {
  const { hh, mm } = parseHHmm(raw);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/**
 * Combine a Berlin calendar date (YYYY-MM-DD, Berlin) and "HH:mm" into an ISO UTC
 * timestamp string. Safe across DST because we compute the Berlin offset for that wall-clock.
 */
export function berlinDateTimeISO(ymd: string, hhmm: string): string {
  const { hh, mm } = parseHHmm(hhmm);
  // Minutes since midnight we want in Berlin wall-clock
  const minutes = hh * 60 + mm;
  // How many minutes Berlin is offset from UTC at that local wall-clock time
  const offset = tzOffsetMinutes(ymd, minutes);
  // Build the UTC instant that corresponds to the Berlin wall-clock time
  const utcBaseline = new Date(`${ymd}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00.000Z`);
  const instant = new Date(utcBaseline.getTime() - offset * 60_000);
  return instant.toISOString();
}

/** Returns a Date representing "now" in Berlin (keeps wall-clock semantics). */
export function berlinNow(): Date {
  // Construct from current UTC components but interpreted in Berlin
  const now = new Date();
  // No need to mutate; callers usually need ISO strings below
  return now;
}

/** Start of day in Berlin for a given Date (default: today), as ISO string (UTC). */
export function startOfBerlinDayISO(d: Date = new Date()): string {
  const ymd = toBerlinYMD(d);
  const utc = new Date(`${ymd}T00:00:00.000Z`); // midnight UTC
  // Shift to Berlin midnight by subtracting the offset between UTC and Berlin
  const offset = tzOffsetMinutes(ymd, 0);
  return new Date(utc.getTime() - offset * 60_000).toISOString();
}

/** End (exclusive) of day in Berlin for a given Date, as ISO string (UTC). */
export function endOfBerlinDayISO(d: Date = new Date()): string {
  const ymd = toBerlinYMD(d);
  const utc = new Date(`${ymd}T24:00:00.000Z`); // next midnight UTC
  const offset = tzOffsetMinutes(ymd, 24 * 60);
  return new Date(utc.getTime() - offset * 60_000).toISOString();
}

/** Format a time (ms since epoch) as 24h HH:mm in Berlin. */
export function formatBerlinHHmm(ms: number): string {
  return new Date(ms).toLocaleTimeString("de-DE", {
    timeZone: BERLIN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });
}

/** Returns YYYY-MM-DD for a Date in Berlin. */
export function toBerlinYMD(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: BERLIN_TZ }); // sv-SE → YYYY-MM-DD
}

/** Returns a new Date shifted by N days in Berlin wall-clock sense. */
export function addBerlinDays(d: Date, days: number): Date {
  const ymd = toBerlinYMD(d);
  const base = new Date(`${ymd}T12:00:00.000Z`); // safe midday anchor
  const offset = tzOffsetMinutes(ymd, 12 * 60);
  const berlinMiddayUtc = new Date(base.getTime() - offset * 60_000);
  const shifted = new Date(berlinMiddayUtc.getTime() + days * 24 * 3600 * 1000);
  return shifted;
}

/** For a sleep date (Berlin), return the previous calendar date key (YYYY-MM-DD, Berlin). */
export function prevBerlinDateKey(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00.000Z`);
  const prev = addBerlinDays(d, -1);
  return toBerlinYMD(prev);
}

/** Internal: minutes between UTC and Berlin for a given YMD + minutes past midnight. */
function tzOffsetMinutes(ymd: string, minutes: number): number {
  // Build a local Berlin time at YMD + minutes, then compare to UTC
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  const local = new Date(
    new Date(`${ymd}T00:00:00.000Z`).toLocaleString("en-US", {
      timeZone: BERLIN_TZ,
    })
  );
  local.setHours(hh, mm, 0, 0);
  // offset = UTC - local (in minutes)
  return Math.round((local.getTime() - Date.parse(`${ymd}T${pad(hh)}:${pad(mm)}:00.000Z`)) / 60_000);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
