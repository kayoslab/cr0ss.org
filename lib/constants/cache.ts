/**
 * Centralized cache tag constants
 *
 * These tags are used with Next.js unstable_cache and revalidateTag
 * to manage cache invalidation across the application.
 */
export const CACHE_TAGS = {
  /** Dashboard overview data cache tag */
  DASHBOARD: 'dashboard',
  /** Dashboard shared data (goals, today's habits) */
  DASHBOARD_SHARED: 'dashboard-shared',
  /** Coffee-specific dashboard data */
  COFFEE: 'coffee',
  /** Habits & productivity dashboard data */
  HABITS: 'habits',
  /** Workouts & running dashboard data */
  WORKOUTS: 'workouts',
  /** Blog posts collection cache tag */
  BLOG_POSTS: 'blogPosts',
  /** Pages collection cache tag */
  PAGES: 'pages',
  /** Countries data cache tag */
  COUNTRIES: 'countries',
} as const;

/**
 * Centralized cache key constants
 *
 * Used for unstable_cache keys to identify specific cached data
 */
export const CACHE_KEYS = {
  /** Dashboard overview data */
  DASHBOARD_DATA: 'dashboard-data',
  /** Dashboard shared data */
  DASHBOARD_SHARED: 'dashboard-shared-data',
  /** Coffee dashboard data */
  COFFEE_DATA: 'coffee-data',
  /** Habits dashboard data */
  HABITS_DATA: 'habits-data',
  /** Workouts dashboard data */
  WORKOUTS_DATA: 'workouts-data',
} as const;

/**
 * Type-safe helper to get cache tag value
 */
export type CacheTag = typeof CACHE_TAGS[keyof typeof CACHE_TAGS];
