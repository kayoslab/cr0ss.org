import { z } from 'zod';
import { createApiRoute, validateRequestBody } from '@/lib/api/middleware';
import { apiSuccess } from '@/lib/api/responses';
import { sql } from '@/lib/db/client';
import { ZCoffee } from '@/lib/db/validation';
import { revalidateCoffee } from '@/lib/cache/revalidate';
import { berlinDateTimeToUTCISO } from '@/lib/time/berlin';
import { getAllCoffeeDTO } from '@/lib/contentful/api/coffee';
import { RATE_LIMITS } from '@/lib/rate/config';

/** GET /api/habits/coffee — coffee catalogue from Contentful (for the logging form). */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('get-coffees', RATE_LIMITS.HABITS)
  .withTrace('GET /api/habits/coffee')
  .handle(async () => {
    const { items } = await getAllCoffeeDTO(1, 20);
    return apiSuccess(items);
  });

const ZCoffeeBatch = z.union([ZCoffee, z.array(ZCoffee)]);

/** Resolve a logged coffee's timestamp: Berlin wall-clock, full ISO, Date, or now. */
function toTimestamp(item: z.infer<typeof ZCoffee>): string {
  if (typeof item.time === 'string' && /^\d{2}:\d{2}$/.test(item.time)) {
    return berlinDateTimeToUTCISO(
      item.date.toISOString().slice(0, 10),
      item.time
    );
  }
  if (typeof item.time === 'string') return item.time;
  if (item.time instanceof Date) return item.time.toISOString();
  return new Date().toISOString();
}

/** POST /api/habits/coffee — log one coffee or an array of them. */
export const POST = createApiRoute()
  .withAuth()
  .withRateLimit('post-coffee', RATE_LIMITS.HABITS)
  .withTrace('POST /api/habits/coffee')
  .handle(async (request) => {
    const parsed = await validateRequestBody(request, ZCoffeeBatch);
    if (!parsed.success) return parsed.response;
    const items = Array.isArray(parsed.data) ? parsed.data : [parsed.data];

    for (const i of items) {
      await sql /*sql*/ `
        INSERT INTO coffee_log (date, time, type, amount_ml, coffee_cf_id)
        VALUES (${i.date}, ${toTimestamp(i)}::timestamptz, ${i.type}, ${i.amount_ml ?? null}, ${i.coffee_cf_id ?? null})
      `;
    }

    revalidateCoffee();
    return apiSuccess({ ok: true, inserted: items.length });
  });
