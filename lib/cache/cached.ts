import { unstable_cache } from 'next/cache';

/**
 * Wrap an async data function in the Next.js data cache with tags that can
 * depend on the arguments. `unstable_cache` fixes its tags at wrapper-creation
 * time, so the wrapper is created per call, keyed by `name` + the arguments.
 *
 * `unstable_cache` is the pre-Cache-Components primitive; when the app enables
 * `cacheComponents` this helper becomes a `'use cache'` function with
 * `cacheTag()`/`cacheLife()` and nothing else has to change.
 *
 * @example
 * export const getCoffeeSummary = cached(
 *   'coffee-summary',
 *   (date: string) => queryCoffeeSummary(date),
 *   { tags: (date) => [tags.coffee.summary(date), tags.coffee.summary()], revalidate: 60 }
 * );
 */
export function cached<A extends (string | number | boolean | undefined)[], R>(
  name: string,
  fn: (...args: A) => Promise<R>,
  options: { tags: (...args: A) => string[]; revalidate: number }
): (...args: A) => Promise<R> {
  return (...args: A) =>
    unstable_cache(() => fn(...args), [name, ...args.map(String)], {
      tags: options.tags(...args),
      revalidate: options.revalidate,
    })();
}
