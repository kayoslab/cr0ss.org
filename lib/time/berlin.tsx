const BERLIN_TZ = "Europe/Berlin";

// -------------------------------------------------------------
// Day boundaries in Berlin time zone
// -------------------------------------------------------------

/** Start of day in Berlin for a given Date (default: today), as ISO string (UTC). */
export function startOfBerlinDayISO(d: Date = new Date()): string {
  const ymd = toBerlinYMD(d);
  return berlinDateTimeToUTCISO(ymd, "00:00");
}

/** End (exclusive) of day in Berlin for a given Date, as ISO string (UTC). */
export function endOfBerlinDayISO(d: Date = new Date()): string {
  const ymd = toBerlinYMD(d);
  // End of day is midnight of the next day
  const nextDay = addBerlinDays(new Date(`${ymd}T12:00:00.000Z`), 1);
  const nextYmd = toBerlinYMD(nextDay);
  return berlinDateTimeToUTCISO(nextYmd, "00:00");
}

/** Align a timestamp to the nearest Berlin hour boundary (rounds down). Returns UTC timestamp in ms. */
export function alignToBerlinHour(ms: number): number {
  const d = new Date(ms);

  // Get Berlin wall-clock hour
  const berlinTime = d.toLocaleTimeString("de-DE", {
    timeZone: BERLIN_TZ,
    hour: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });
  const berlinHour = parseInt(berlinTime.split(":")[0], 10);

  // Get Berlin calendar date (YYYY-MM-DD)
  const ymd = toBerlinYMD(d);

  // Convert Berlin local time (YYYY-MM-DD HH:00) → UTC instant
  const berlinHHmm = `${String(berlinHour).padStart(2, "0")}:00`;
  const utcISO = berlinDateTimeToUTCISO(ymd, berlinHHmm);

  return Date.parse(utcISO);
}

// -------------------------------------------------------------
// Date arithmetic in Berlin wall-clock sense
// -------------------------------------------------------------

/** Returns a new Date shifted by N days in Berlin wall-clock sense. */
export function addBerlinDays(d: Date, days: number): Date {
  const ymd = toBerlinYMD(d);
  // Get Berlin noon as UTC timestamp
  const berlinMiddayUtc = berlinDateTimeToUTCISO(ymd, "12:00");
  // Add N days (in milliseconds)
  const shifted = new Date(Date.parse(berlinMiddayUtc) + days * 24 * 3600 * 1000);
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
  // Strategy: Create a date in the local timezone, interpret it as if it were Berlin time,
  // then extract the UTC timestamp. We use binary search or UTC offset calculation.

  const [h, m] = (hhmm || "00:00").split(":").map((n) => Math.max(0, parseInt(n || "0", 10)));

  // Start with a guess: Berlin time matches UTC time (will be off by 1-2 hours)
  let guessUTC = Date.parse(`${ymd}T${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00.000Z`);

  // Check what this UTC time looks like in Berlin
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: BERLIN_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Iterate to find the correct UTC time (usually converges in 1-2 iterations)
  for (let i = 0; i < 3; i++) {
    const parts = formatter.formatToParts(new Date(guessUTC));
    const get = (t: string) => Number(parts.find(p => p.type === t)?.value || "0");

    const berlinH = get("hour");
    const berlinM = get("minute");
    const berlinD = get("day");
    const berlinMo = get("month");
    const berlinY = get("year");

    // Check if we found the right time
    const [targetY, targetMo, targetD] = ymd.split("-").map(Number);
    if (berlinY === targetY && berlinMo === targetMo && berlinD === targetD &&
        berlinH === h && berlinM === m) {
      return new Date(guessUTC).toISOString();
    }

    // Calculate the difference and adjust
    const berlinYMD = `${berlinY}-${String(berlinMo).padStart(2, "0")}-${String(berlinD).padStart(2, "0")}`;
    const berlinTimeMs = Date.parse(`${berlinYMD}T${String(berlinH).padStart(2, "0")}:${String(berlinM).padStart(2, "0")}:00.000Z`);
    const targetTimeMs = Date.parse(`${ymd}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00.000Z`);
    const deltaMs = targetTimeMs - berlinTimeMs;

    guessUTC += deltaMs;
  }

  return new Date(guessUTC).toISOString();
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
// (none currently needed)