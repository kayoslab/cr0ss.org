/**
 * Centralized cache tag constants
 *
 * These tags are used with Next.js unstable_cache and revalidateTag
 * to manage cache invalidation across the application.
 *
 * For granular dashboard cache tags, use the builders from lib/api/cache.ts
 */
export const CACHE_TAGS = {
  /** Dashboard overview data cache tag (legacy - use dashboardTags() for new code) */
  DASHBOARD: 'dashboard',
  /** Dashboard shared data (goals, today's habits) */
  DASHBOARD_SHARED: 'dashboard-shared',
  /** Coffee-specific dashboard data (legacy - use coffeeTags() for new code) */
  COFFEE: 'coffee',
  /** Habits & productivity dashboard data (legacy - use habitsTags() for new code) */
  HABITS: 'habits',
  /** Workouts & running dashboard data (legacy - use workoutsTags() for new code) */
  WORKOUTS: 'workouts',
  /** Blog posts collection cache tag */
  BLOG_POSTS: 'blogPosts',
  /** Pages collection cache tag */
  PAGES: 'pages',
  /** Countries data cache tag */
  COUNTRIES: 'countries',

  /**
   * Granular cache tag builders for dashboard API v1
   *
   * Pattern: domain:resource:params
   * Example: coffee:summary:2025-12-05
   */
  coffee: (resource: string, ...params: (string | number)[]) => {
    const parts = ['coffee', resource, ...params.map(String)].filter(Boolean);
    return parts.join(':');
  },
  workouts: (resource: string, ...params: (string | number)[]) => {
    const parts = ['workouts', resource, ...params.map(String)].filter(Boolean);
    return parts.join(':');
  },
  habits: (resource: string, ...params: (string | number)[]) => {
    const parts = ['habits', resource, ...params.map(String)].filter(Boolean);
    return parts.join(':');
  },
  goals: (resource: string, ...params: (string | number)[]) => {
    const parts = ['goals', resource, ...params.map(String)].filter(Boolean);
    return parts.join(':');
  },
  insights: (resource: string, ...params: (string | number)[]) => {
    const parts = ['insights', resource, ...params.map(String)].filter(Boolean);
    return parts.join(':');
  },
  dashboard: (resource: string, ...params: (string | number)[]) => {
    const parts = ['dashboard', resource, ...params.map(String)].filter(Boolean);
    return parts.join(':');
  },
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
