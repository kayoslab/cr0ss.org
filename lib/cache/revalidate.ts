import { revalidateTag, revalidatePath } from 'next/cache';
import { invalidations } from '@/lib/cache/tags';
import { PATHS } from '@/lib/constants/paths';

function invalidate(tagList: readonly string[]) {
  for (const tag of tagList) revalidateTag(tag, 'max');
  revalidatePath(PATHS.DASHBOARD, 'page');
}

/** Revalidate every dashboard cache. Use when unsure which event applies. */
export function revalidateDashboard() {
  const all = new Set<string>(Object.values(invalidations).flat());
  invalidate([...all]);
}

/** Call after coffee logging. */
export function revalidateCoffee() {
  invalidate(invalidations.coffee);
}

/** Call after habits logging. */
export function revalidateHabits() {
  invalidate(invalidations.habits);
}

/** Call after workout or run logging, or a Strava sync. */
export function revalidateWorkouts() {
  invalidate(invalidations.workouts);
}

/** Call after goal changes. */
export function revalidateGoals() {
  invalidate(invalidations.goals);
}

/** Call after body-profile changes. */
export function revalidateShared() {
  invalidate(invalidations.bodyProfile);
}

/** Call when a new location is logged. */
export function revalidateLocation() {
  invalidate(invalidations.location);
}

/** Call when a country is visited for the first time. */
export function revalidateCountries() {
  invalidate(invalidations.countries);
}
