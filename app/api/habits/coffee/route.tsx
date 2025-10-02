export const runtime = "edge";

import { rateLimit } from "@/lib/rate/limit";
import { wrapTrace } from "@/lib/obs/trace";
import { sql } from "@/lib/db/client";
import { ZCoffee, type TCoffee } from "@/lib/db/validation";
import { revalidateDashboard } from "@/lib/cache/revalidate";
import { assertSecret } from "@/lib/auth/secret";
import { 
  toBerlinYMD,
  berlinDateTimeToUTCISO,
  normalizeHHmm 
} from "@/lib/time/berlin";
import { getAllCoffeeDTO } from "@/lib/contentful/api/coffee";

function isValidDate(v: unknown): v is Date {
  return v instanceof Date && !Number.isNaN(v.getTime());
}

// GET all coffees from Contentful (up to 20)
export const GET = wrapTrace("GET /api/habits/coffee", async (req: Request) => {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "get-coffees", { windowSec: 60, max: 10 });
    if (!rl.ok) {
      return new Response("Too many requests", {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      });
    }

    const { items } = await getAllCoffeeDTO(1, 20);
    return new Response(JSON.stringify(items), { status: 200 });
  } catch (err: any) {
    return new Response(err?.message ?? "Bad Request", { status: err?.status ?? 400 });
  }
});

// POST new coffee log entry or entries (single object or array)
export const POST = wrapTrace("POST /api/habits/coffee", async (req: Request) => {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "post-coffee", { windowSec: 60, max: 10 });
    if (!rl.ok) {
      return new Response("Too many requests", {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      });
    }

    const body = await req.json();
    const items = (Array.isArray(body) ? body : [body]) as unknown[];
    const parsed: TCoffee[] = items.map((i) => ZCoffee.parse(i));

    for (const i of parsed) {
      const ymd = toBerlinYMD(i.date);
      let tsISO: string;

      if (typeof i.time === "string" && i.time.trim() !== "") {
        const t = i.time.trim();

        if (/^\d{2}:\d{2}$/.test(t)) {
          // HH:mm → interpret as Berlin wall-clock for the given `date`
          tsISO = berlinDateTimeToUTCISO(ymd, t);
        } else {
          // otherwise try as ISO-like string
          const d = new Date(t);
          if (Number.isFinite(d.getTime())) {
            tsISO = d.toISOString();
          } else {
            // bare "YYYY-MM-DDTHH:mm" → normalize and treat as Berlin
            const hhmm = normalizeHHmm(t.slice(11, 16));
            tsISO = berlinDateTimeToUTCISO(ymd, hhmm);
          }
        }
      } else if (isValidDate(i.time)) {
        // Actual Date instance (from server/internal callers)
        tsISO = i.time.toISOString();
      } else {
        // No time → “now” in Berlin
        const now = new Date();
        const hh = now.toLocaleTimeString("de-DE", {
          timeZone: "Europe/Berlin",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          hourCycle: "h23",
        });
        tsISO = berlinDateTimeToUTCISO(toBerlinYMD(now), hh);
      }

      await sql/*sql*/`
        INSERT INTO coffee_log (date, time, type, amount_ml, coffee_cf_id)
        VALUES (${i.date}, ${tsISO}::timestamptz, ${i.type}, ${i.amount_ml ?? null}, ${i.coffee_cf_id ?? null})
      `;
    }

    revalidateDashboard();
    return new Response(JSON.stringify({ ok: true, inserted: parsed.length }), { status: 200 });
  } catch (err: any) {
    return new Response(err?.message ?? "Bad Request", { status: err?.status ?? 400 });
  }
});