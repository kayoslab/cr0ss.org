/**
 * The one registry of cache tags.
 *
 * Every tag the app attaches to cached data (Contentful fetches, dashboard
 * queries) and every tag it revalidates comes from here, so a producer and an
 * invalidator can never drift apart on spelling. `lib/cache/tags.test.ts`
 * asserts that every invalidation set below only contains registered tags.
 *
 * Parametric tags (e.g. `coffee:summary:2025-12-05`) are produced by
 * functions; calling one with no arguments yields the general form
 * (`coffee:summary`). Cached data is tagged with both, and invalidation
 * targets the general form, because `revalidateTag` matches exactly.
 */

type Part = string | number | undefined;
const join = (...parts: Part[]) =>
  parts.filter((p) => p !== undefined && p !== '').join(':');

export const tags = {
  /** Contentful content types (matches the webhook's `sys.contentType.sys.id`). */
  content: {
    blogPosts: 'blogPosts',
    pages: 'pages',
    categories: 'categories',
    countries: 'countries',
    coffee: 'coffee',
    knowledgeBase: 'knowledgeBase',
    portfolioProjects: 'portfolioProjects',
    /** A single entry, tagged by its slug or id. */
    entry: (slugOrId: string) => slugOrId,
  },

  dashboard: {
    /** The overview page's composite data. */
    overview: 'dashboard',
    location: 'dashboard:location',
    countries: 'dashboard:countries',
    settingsCoffee: 'dashboard:settings:coffee',
  },

  coffee: {
    summary: (date?: string) => join('coffee', 'summary', date),
    timeline: (start?: string, end?: string, granularity?: string) =>
      join('coffee', 'timeline', start, end, granularity),
    caffeine: (date?: string) => join('coffee', 'caffeine', date),
    origins: 'coffee:origins',
  },

  habits: {
    today: (date?: string) => join('habits', 'today', date),
    consistency: (days?: number) => join('habits', 'consistency', days),
    streaks: 'habits:streaks',
    trends: (habits?: string, days?: number) =>
      join('habits', 'trends', habits, days),
    sleepQuality: 'habits:sleep-quality',
  },

  workouts: {
    summary: (period?: string) => join('workouts', 'summary', period),
    heatmap: (days?: number, type?: string) =>
      join('workouts', 'heatmap', days, type),
    running: (period?: string) => join('workouts', 'running', period),
  },

  goals: {
    list: 'goals',
    progress: (period?: string) => join('goals', 'progress', period),
  },

  insights: {
    correlations: (days?: number) => join('insights', 'correlations', days),
  },
} as const;

/**
 * Which tags a data-changing event must invalidate. Kept next to the registry
 * so adding a tag and forgetting its invalidation is visible in one diff.
 */
export const invalidations = {
  /** A coffee was logged (or edited). */
  coffee: [
    tags.coffee.summary(),
    tags.coffee.timeline(),
    tags.coffee.caffeine(),
    tags.coffee.origins,
    tags.habits.sleepQuality, // residual caffeine feeds the sleep chart
    tags.dashboard.overview,
  ],
  /** A day's habit numbers changed. */
  habits: [
    tags.habits.today(),
    tags.habits.consistency(),
    tags.habits.streaks,
    tags.habits.trends(),
    tags.habits.sleepQuality,
    tags.goals.progress(),
    tags.dashboard.overview,
  ],
  /** A workout or run was logged, or Strava synced. */
  workouts: [
    tags.workouts.summary(),
    tags.workouts.heatmap(),
    tags.workouts.running(),
    tags.habits.sleepQuality, // previous-day workout feeds the sleep chart
    tags.goals.progress(),
    tags.dashboard.overview,
  ],
  /** Goals were created, updated or deleted. */
  goals: [
    tags.goals.list,
    tags.goals.progress(),
    tags.habits.consistency(), // targets come from goals
    tags.habits.streaks,
    tags.workouts.running(), // monthly running progress
    tags.dashboard.overview,
  ],
  /** Body profile changed (affects caffeine modelling). */
  bodyProfile: [
    tags.coffee.caffeine(),
    tags.habits.sleepQuality,
    tags.dashboard.overview,
  ],
  /** A new location was logged. */
  location: [tags.dashboard.location, tags.dashboard.overview],
  /** A country was visited for the first time (or Contentful countries changed). */
  countries: [tags.dashboard.countries, tags.dashboard.overview],
} as const;

/**
 * Cache profiles, defined in next.config.mjs (`cacheLife`). Named here so a
 * data function can't reference a profile that isn't configured.
 */
export type CacheProfile =
  'realtime' | 'frequent' | 'standard' | 'stable' | 'content';

/**
 * Every tag in its general form, for the containment test and for tooling.
 * Parametric tags contribute their no-argument form.
 */
export function allBaseTags(): Set<string> {
  const out = new Set<string>();
  const walk = (node: unknown) => {
    if (typeof node === 'string') out.add(node);
    else if (typeof node === 'function') {
      const v = (node as () => unknown)();
      if (typeof v === 'string' && v !== '') out.add(v);
    } else if (node && typeof node === 'object')
      Object.values(node).forEach(walk);
  };
  walk(tags);
  return out;
}
