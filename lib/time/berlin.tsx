const BERLIN_TZ = "Europe/Berlin";

// -------------------------------------------------------------
// Day boundaries in Berlin time zone
// -------------------------------------------------------------

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

// -------------------------------------------------------------
// Date arithmetic in Berlin wall-clock sense
// -------------------------------------------------------------

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

// -------------------------------------------------------------
// Public Date helpers
// -------------------------------------------------------------

/** Format a time (ms since epoch) as 24h HH:mm in Berlin. */
export function isoToBerlinDate(ms: number): string {
  return new Date(ms).toLocaleTimeString("de-DE", {
    timeZone: BERLIN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });
}

/**
 * Convert a Berlin wall-clock date/time ("YYYY-MM-DD" + "HH:mm") to a UTC ISO string.
 * This respects DST transitions by asking the runtime for the Berlin offset.
 */
export function berlinDateTimeToUTCISO(ymd: string, hhmm: string): string {
  const [h, m] = normalizeHHmm(hhmm).split(":").map((s) => Number(s));
  // Build a Date that represents that wall-clock in Berlin:
  // Trick: create a Date from the Berlin-local string, then read its UTC instant.
  const berlinLocal = new Date(
    new Date(`${ymd}T00:00:00.000Z`).toLocaleString("en-US", { timeZone: BERLIN_TZ })
  );
  berlinLocal.setHours(h, m, 0, 0);
  return new Date(berlinLocal.getTime()).toISOString();
}

/** Returns YYYY-MM-DD for a Date in Berlin. */
export function toBerlinYMD(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: BERLIN_TZ }); // sv-SE → YYYY-MM-DD
}

/** Normalize "HH:mm" -> "HH:mm" (24h, zero-padded). */
export function normalizeHHmm(v: string): string {
  const m = /^(\d{1,2})(?::?(\d{1,2}))?$/.exec(String(v).trim());
  const hh = Math.max(0, Math.min(23, Number(m?.[1] ?? 0)));
  const mm = Math.max(0, Math.min(59, Number(m?.[2] ?? 0)));
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// -------------------------------------------------------------
// Private Helpers
// -------------------------------------------------------------

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