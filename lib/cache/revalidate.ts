import { revalidateTag, revalidatePath } from 'next/cache';
import { CACHE_TAGS } from '@/lib/constants/cache';
import { PATHS } from '@/lib/constants/paths';

/**
 * Revalidate all dashboard caches
 * Use when you're unsure which specific cache to invalidate
 */
export function revalidateDashboard() {
  revalidateTag(CACHE_TAGS.DASHBOARD, 'max');
  revalidateTag(CACHE_TAGS.DASHBOARD_SHARED, 'max');
  revalidateTag(CACHE_TAGS.COFFEE, 'max');
  revalidateTag(CACHE_TAGS.HABITS, 'max');
  revalidateTag(CACHE_TAGS.WORKOUTS, 'max');
  revalidatePath(PATHS.DASHBOARD, 'page');
}

/**
 * Revalidate coffee-specific dashboard caches
 * Call after coffee logging
 */
export function revalidateCoffee() {
  // Get current date in Berlin timezone for specific cache invalidation
  const now = new Date();
  const berlinTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' })
  );
  const today = berlinTime.toISOString().split('T')[0];

  // Invalidate granular API endpoint caches
  revalidateTag(`coffee:summary:${today}`, 'max'); // Today's summary
  revalidateTag('coffee:summary', 'max'); // All summaries
  revalidateTag('coffee:timeline', 'max'); // All timeline variations (wildcard)
  revalidateTag(`coffee:caffeine:${today}`, 'max'); // Today's caffeine curve
  revalidateTag('coffee:caffeine', 'max'); // All caffeine curves
  revalidateTag('coffee:origins', 'max'); // Coffee origins (countries)

  // Invalidate legacy dashboard caches for backward compatibility
  revalidateTag(CACHE_TAGS.COFFEE, 'max');
  revalidateTag(CACHE_TAGS.DASHBOARD_SHARED, 'max'); // Shared data includes coffee counts
  revalidateTag(CACHE_TAGS.DASHBOARD, 'max'); // Overview page shows coffee data
  revalidatePath(PATHS.DASHBOARD, 'page');
}

/**
 * Revalidate habits-specific dashboard caches
 * Call after habits logging
 */
export function revalidateHabits() {
  // Get current date in Berlin timezone for specific cache invalidation
  const now = new Date();
  const berlinTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' })
  );
  const today = berlinTime.toISOString().split('T')[0];

  // Invalidate granular API endpoint caches
  revalidateTag(`habits:today:${today}`, 'max'); // Today's habits data
  revalidateTag('habits:today', 'max'); // All habits today variations
  revalidateTag('habits:consistency', 'max'); // All consistency variations (wildcard)
  revalidateTag('habits:streaks', 'max'); // Streaks data
  revalidateTag('habits:trends', 'max'); // All trends variations (wildcard)

  // Invalidate legacy dashboard caches for backward compatibility
  revalidateTag(CACHE_TAGS.HABITS, 'max');
  revalidateTag(CACHE_TAGS.DASHBOARD_SHARED, 'max'); // Shared data includes habits
  revalidateTag(CACHE_TAGS.DASHBOARD, 'max'); // Overview page shows habits data
  revalidatePath(PATHS.DASHBOARD, 'page');
}

/**
 * Revalidate workouts-specific dashboard caches
 * Call after workout or run logging, Strava sync, or goal updates
 */
export function revalidateWorkouts() {
  // Invalidate granular API endpoint caches
  revalidateTag('workouts:summary', 'max'); // All summary variations (wildcard)
  revalidateTag('workouts:heatmap', 'max'); // All heatmap variations (wildcard)
  revalidateTag('workouts:running', 'max'); // All running stats variations (wildcard)

  // Invalidate legacy dashboard caches for backward compatibility
  revalidateTag(CACHE_TAGS.WORKOUTS, 'max');
  revalidateTag(CACHE_TAGS.DASHBOARD_SHARED, 'max'); // Shared data may include workout-related habits
  revalidateTag(CACHE_TAGS.DASHBOARD, 'max'); // Overview page shows workout data
  revalidatePath(PATHS.DASHBOARD, 'page');
}

/**
 * Revalidate shared dashboard data only
 * Call after goal updates or body profile changes
 */
export function revalidateShared() {
  revalidateTag(CACHE_TAGS.DASHBOARD_SHARED, 'max');
  revalidateTag(CACHE_TAGS.DASHBOARD, 'max'); // Overview depends on shared data
  revalidatePath(PATHS.DASHBOARD, 'page');

  // Goal updates affect workout stats (e.g., running monthly progress)
  revalidateTag('workouts:running', 'max'); // All running stats variations
}

/**
 * Revalidate goals-specific dashboard caches
 * Call after goal updates (creating, updating, or deleting goals)
 */
export function revalidateGoals() {
  // Invalidate granular API endpoint caches
  revalidateTag('goals', 'max'); // Goals list
  revalidateTag('goals:progress', 'max'); // All progress variations (wildcard)

  // Goals affect other systems
  revalidateTag('habits:consistency', 'max'); // Consistency depends on daily goals
  revalidateTag('habits:streaks', 'max'); // Streaks depend on daily goals
  revalidateTag('workouts:running', 'max'); // Monthly progress depends on running goals

  // Invalidate legacy dashboard caches for backward compatibility
  revalidateTag(CACHE_TAGS.DASHBOARD_SHARED, 'max'); // Shared data includes goals
  revalidateTag(CACHE_TAGS.DASHBOARD, 'max'); // Overview page shows goal-dependent data
  revalidatePath(PATHS.DASHBOARD, 'page');
}

/**
 * Revalidate countries-specific dashboard caches
 * Call when a new country is visited
 */
export function revalidateCountries() {
  revalidateTag('dashboard:countries', 'max'); // Countries list
  revalidateTag('dashboard:countries:visited', 'max'); // Visited countries filter
  revalidateTag(CACHE_TAGS.DASHBOARD, 'max'); // Overview page may show country data
  revalidatePath(PATHS.DASHBOARD, 'page');
}
