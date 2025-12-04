import { revalidateTag, revalidatePath } from "next/cache";
import { CACHE_TAGS } from "@/lib/constants/cache";
import { PATHS } from "@/lib/constants/paths";

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
  revalidateTag(CACHE_TAGS.HABITS);
  revalidateTag(CACHE_TAGS.DASHBOARD_SHARED); // Shared data includes habits
  revalidateTag(CACHE_TAGS.DASHBOARD); // Overview page shows habits data
  revalidatePath(PATHS.DASHBOARD, "page");
}

/**
 * Revalidate workouts-specific dashboard caches
 * Call after workout or run logging
 */
export function revalidateWorkouts() {
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
}