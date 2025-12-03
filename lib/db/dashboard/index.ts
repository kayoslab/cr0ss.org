/**
 * Dashboard data modules
 *
 * Provides page-specific data fetchers with granular caching
 */

export { getSharedDashboardData, type SharedDashboardData } from "./shared";
export { getCoffeeDashboardData, type CoffeeDashboardData } from "./coffee";
export { getWorkoutsDashboardData, type WorkoutsDashboardData } from "./workouts";
export { getHabitsDashboardData, type HabitsDashboardData } from "./habits";
export { getOverviewDashboardData, type OverviewDashboardData } from "./overview";
