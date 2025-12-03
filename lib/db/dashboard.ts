/**
 * Dashboard data aggregation
 *
 * Re-exports page-specific data fetchers from the dashboard module.
 * This file maintains backwards compatibility while the codebase migrates
 * to using the new modular dashboard structure.
 */

export {
  getSharedDashboardData,
  getCoffeeDashboardData,
  getWorkoutsDashboardData,
  getHabitsDashboardData,
  getOverviewDashboardData,
  type SharedDashboardData,
  type CoffeeDashboardData,
  type WorkoutsDashboardData,
  type HabitsDashboardData,
  type OverviewDashboardData,
} from "./dashboard/index";

// Legacy export for backwards compatibility
export { getOverviewDashboardData as getDashboardData } from "./dashboard/overview";
export type { OverviewDashboardData as DashboardData } from "./dashboard/overview";
