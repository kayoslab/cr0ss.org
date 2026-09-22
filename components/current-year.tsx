import { cacheLife } from 'next/cache';

/**
 * The current year for the copyright line. Cached for a day so the footer
 * stays part of the prerendered shell instead of forcing a request-time read.
 */
export async function CurrentYear() {
  'use cache';
  cacheLife('days');
  return <>{new Date().getFullYear()}</>;
}
