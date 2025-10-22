/**
 * Centralized cache tag constants
 *
 * These tags are used with Next.js unstable_cache and revalidateTag
 * to manage cache invalidation across the application.
 */
export const CACHE_TAGS = {
  /** Dashboard data cache tag */
  DASHBOARD: 'dashboard',
  /** Blog posts collection cache tag */
  BLOG_POSTS: 'blogPosts',
  /** Pages collection cache tag */
  PAGES: 'pages',
  /** Countries data cache tag */
  COUNTRIES: 'countries',
  /** Coffee data cache tag */
  COFFEE: 'coffee',
} as const;

/**
 * Centralized cache key constants
 *
 * Used for unstable_cache keys to identify specific cached data
 */
export const CACHE_KEYS = {
  /** Dashboard data */
  DASHBOARD_DATA: 'dashboard-data',
} as const;

/**
 * Type-safe helper to get cache tag value
 */
export type CacheTag = typeof CACHE_TAGS[keyof typeof CACHE_TAGS];
