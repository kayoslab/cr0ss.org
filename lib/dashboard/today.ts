import { cacheLife } from 'next/cache';
import { sql } from '@/lib/db/client';

/**
 * Today's date in Europe/Berlin (YYYY-MM-DD), resolved by the database so it
 * agrees with every date column the dashboard queries compare against.
 * Cached on the realtime profile: the pages that read it stay fully
 * prerendered and roll over within a minute of midnight.
 */
export async function berlinToday(): Promise<string> {
  'use cache';
  cacheLife('realtime');
  const [{ current_date }] = await sql /*sql*/ `
    SELECT timezone('Europe/Berlin', now())::date::text as current_date
  `;
  return String(current_date);
}
