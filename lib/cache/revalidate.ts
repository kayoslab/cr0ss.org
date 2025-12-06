import { revalidateTag as _revalidateTag, revalidatePath } from "next/cache";
import { CACHE_TAGS } from "@/lib/constants/cache";
import { PATHS } from "@/lib/constants/paths";

// Type-safe wrapper for revalidateTag that works in edge runtime
// Edge runtime doesn't support the second parameter properly despite TypeScript requiring it
const revalidateTag = (tag: string) => (_revalidateTag as (tag: string) => void)(tag);

/**
 * Revalidate all dashboard caches
 * Use when you're unsure which specific cache to invalidate
 */
export function revalidateDashboard() {
  revalidateTag(CACHE_TAGS.DASHBOARD);
  revalidateTag(CACHE_TAGS.DASHBOARD_SHARED);
  revalidateTag(CACHE_TAGS.COFFEE);
  revalidateTag(CACHE_TAGS.HABITS);
  revalidateTag(CACHE_TAGS.WORKOUTS);
  revalidatePath(PATHS.DASHBOARD, "page");
}

/**
 * Revalidate coffee-specific dashboard caches
 * Call after coffee logging
 */
export function revalidateCoffee() {
  // Get current date in Berlin timezone for specific cache invalidation
  const now = new Date();
  const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const today = berlinTime.toISOString().split('T')[0];

  // Invalidate granular API endpoint caches
  revalidateTag(`coffee:summary:${today}`); // Today's summary
  revalidateTag('coffee:summary'); // All summaries
  revalidateTag('coffee:timeline'); // All timeline variations (wildcard)
  revalidateTag(`coffee:caffeine:${today}`); // Today's caffeine curve
  revalidateTag('coffee:caffeine'); // All caffeine curves

  // Invalidate legacy dashboard caches for backward compatibility
  revalidateTag(CACHE_TAGS.COFFEE);
  revalidateTag(CACHE_TAGS.DASHBOARD_SHARED); // Shared data includes coffee counts
  revalidateTag(CACHE_TAGS.DASHBOARD); // Overview page shows coffee data
  revalidatePath(PATHS.DASHBOARD, "page");
}

/**
 * Revalidate habits-specific dashboard caches
 * Call after habits logging
 */
export function revalidateHabits() {
  // Get current date in Berlin timezone for specific cache invalidation
  const now = new Date();
  const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const today = berlinTime.toISOString().split('T')[0];

  // Invalidate granular API endpoint caches
  revalidateTag(`habits:today:${today}`); // Today's habits data
  revalidateTag('habits:today'); // All habits today variations
  revalidateTag('habits:consistency'); // All consistency variations (wildcard)
  revalidateTag('habits:streaks'); // Streaks data
  revalidateTag('habits:trends'); // All trends variations (wildcard)

  // Invalidate legacy dashboard caches for backward compatibility
  revalidateTag(CACHE_TAGS.HABITS);
  revalidateTag(CACHE_TAGS.DASHBOARD_SHARED); // Shared data includes habits
  revalidateTag(CACHE_TAGS.DASHBOARD); // Overview page shows habits data
  revalidatePath(PATHS.DASHBOARD, "page");
}

/**
 * Revalidate workouts-specific dashboard caches
 * Call after workout or run logging, Strava sync, or goal updates
 */
export function revalidateWorkouts() {
  // Invalidate granular API endpoint caches
  revalidateTag('workouts:summary'); // All summary variations (wildcard)
  revalidateTag('workouts:heatmap'); // All heatmap variations (wildcard)
  revalidateTag('workouts:running'); // All running stats variations (wildcard)

  // Invalidate legacy dashboard caches for backward compatibility
  revalidateTag(CACHE_TAGS.WORKOUTS);
  revalidateTag(CACHE_TAGS.DASHBOARD_SHARED); // Shared data may include workout-related habits
  revalidateTag(CACHE_TAGS.DASHBOARD); // Overview page shows workout data
  revalidatePath(PATHS.DASHBOARD, "page");
}

/**
 * Revalidate shared dashboard data only
 * Call after goal updates or body profile changes
 */
export function revalidateShared() {
  revalidateTag(CACHE_TAGS.DASHBOARD_SHARED);
  revalidateTag(CACHE_TAGS.DASHBOARD); // Overview depends on shared data
  revalidatePath(PATHS.DASHBOARD, "page");

  // Goal updates affect workout stats (e.g., running monthly progress)
  revalidateTag('workouts:running'); // All running stats variations
}

/**
 * Revalidate goals-specific dashboard caches
 * Call after goal updates (creating, updating, or deleting goals)
 */
export function revalidateGoals() {
  // Invalidate granular API endpoint caches
  revalidateTag('goals'); // Goals list
  revalidateTag('goals:progress'); // All progress variations (wildcard)

  // Goals affect other systems
  revalidateTag('habits:consistency'); // Consistency depends on daily goals
  revalidateTag('habits:streaks'); // Streaks depend on daily goals
  revalidateTag('workouts:running'); // Monthly progress depends on running goals

  // Invalidate legacy dashboard caches for backward compatibility
  revalidateTag(CACHE_TAGS.DASHBOARD_SHARED); // Shared data includes goals
  revalidateTag(CACHE_TAGS.DASHBOARD); // Overview page shows goal-dependent data
  revalidatePath(PATHS.DASHBOARD, "page");
}