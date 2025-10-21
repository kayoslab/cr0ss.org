export const runtime = "edge";

import { rateLimit } from "@/lib/rate/limit";
import { wrapTrace } from "@/lib/obs/trace";
import { sql } from "@/lib/db/client";
import { ZCoffee } from "@/lib/db/validation";
import { revalidateDashboard } from "@/lib/cache/revalidate";
import { assertSecret } from "@/lib/auth/secret";
import {
  berlinDateTimeToUTCISO,
} from "@/lib/time/berlin";
import { getAllCoffeeDTO } from "@/lib/contentful/api/coffee";

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
  } catch (err: unknown) {
    const error = err as { message?: string; status?: number };
    return new Response(error?.message ?? "Bad Request", { status: error?.status ?? 400 });
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
    const items = Array.isArray(body) ? body : [body];

    const parsed = [];
    for (const item of items) {
      const result = ZCoffee.safeParse(item);
      if (!result.success) {
        return new Response(
          JSON.stringify({ message: "Validation failed", errors: result.error.flatten() }),
          { status: 400 }
        );
      }
      parsed.push(result.data);
    }

    for (const i of parsed) {
      let tsISO: string;

      if (typeof i.time === "string" && /^\d{2}:\d{2}$/.test(i.time)) {
        // Berlin wall-clock → UTC instant
        const ymd = i.date.toISOString().slice(0, 10); // date is already a Date
        tsISO = berlinDateTimeToUTCISO(ymd, i.time);
      } else if (i.time && typeof i.time === "string") {
        // Full ISO provided -> trust it
        tsISO = i.time;
      } else if (i.time && i.time instanceof Date) {
        // Rare path: time is a Date
        tsISO = i.time.toISOString();
      } else {
        tsISO = new Date().toISOString();
      }

      await sql/*sql*/`
        INSERT INTO coffee_log (date, time, type, amount_ml, coffee_cf_id)
        VALUES (${i.date}, ${tsISO}::timestamptz, ${i.type}, ${i.amount_ml ?? null}, ${i.coffee_cf_id ?? null})
      `;
    }

    revalidateDashboard();
    return new Response(JSON.stringify({ ok: true, inserted: parsed.length }), { status: 200 });
  } catch (err: unknown) {
    const error = err as { message?: string; status?: number };
    return new Response(error?.message ?? "Bad Request", { status: error?.status ?? 400 });
  }
});