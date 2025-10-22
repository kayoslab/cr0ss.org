/**
 * Centralized application constants
 *
 * This barrel file exports all constants from a single location,
 * making it easy to import and maintain consistency across the application.
 *
 * @example
 * ```ts
 * import { CACHE_TAGS, RATE_LIMIT_BUCKETS, PATHS } from '@/lib/constants';
 *
 * revalidateTag(CACHE_TAGS.DASHBOARD);
 * await rateLimit(req, RATE_LIMIT_BUCKETS.GET_DASHBOARD);
 * revalidatePath(PATHS.DASHBOARD);
 * ```
 */

export { CACHE_TAGS, CACHE_KEYS, type CacheTag } from './cache';
export { RATE_LIMIT_BUCKETS, type RateLimitBucket } from './rate-limits';
export { PATHS, type AppPath } from './paths';
