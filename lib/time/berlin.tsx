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

/** Combine a Berlin calendar date (YYYY-MM-DD) and HH:mm into a UTC ISO instant. */
export function berlinDateTimeToUTCISO(ymd: string, hhmm: string): string {
  // Build a Berlin local time, then obtain the matching UTC timestamp.
  // Trick: Intl gives us the offset by formatting the UTC time *as if* in Berlin.
  const [h, m] = (hhmm || "00:00").split(":").map((n) => Math.max(0, parseInt(n || "0", 10)));
  // Create a Date for "ymd 00:00 UTC"
  const baseUtc = new Date(`${ymd}T00:00:00.000Z`);
  // What is that instant's Berlin wall-clock?
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BERLIN_TZ,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(baseUtc);

  // Extract the Berlin midnight components for that UTC day
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value || "0");
  const y = get("year"), mo = get("month"), d = get("day");

  // Compose the desired Berlin local time on that calendar day
  // and ask Date to interpret it *as UTC* so we can compute delta cleanly.
  const berlinLocalAsUTC = Date.parse(`${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}T${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00.000Z`);

  // Find the real UTC instant that shows that Berlin wall-clock:
  // take the original UTC midnight and add the delta between desired local time and local midnight
  const berlinMidnightAsUTC = Date.parse(`${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}T00:00:00.000Z`);
  const deltaMs = berlinLocalAsUTC - berlinMidnightAsUTC;

  return new Date(baseUtc.getTime() + deltaMs).toISOString();
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

function pad(n: number) {
  return String(n).padStart(2, "0");
}