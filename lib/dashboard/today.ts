import { sql } from '@/lib/db/client';

/**
 * Today's date in Europe/Berlin (YYYY-MM-DD), resolved by the database so it
 * agrees with every date column the dashboard queries compare against.
 * Deliberately not cached: it's the input that keys the cached queries.
 */
export async function berlinToday(): Promise<string> {
  const [{ current_date }] = await sql /*sql*/ `
    SELECT timezone('Europe/Berlin', now())::date::text as current_date
  `;
  return String(current_date);
}
