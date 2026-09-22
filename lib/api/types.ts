/**
 * Response types of the /api/v1/dashboard/* endpoints.
 *
 * They are the return types of the lib/dashboard data functions — the routes
 * serialise those objects unchanged — so they are re-exported from there
 * rather than declared twice.
 */

export type {
  CoffeeSummary as CoffeeSummaryResponse,
  CoffeeTimeline as CoffeeTimelineResponse,
  CaffeineCurve as CaffeineCurveResponse,
  CoffeeOrigins as CoffeeOriginsResponse,
} from '@/lib/dashboard/coffee';

export type {
  WorkoutsSummary as WorkoutsSummaryResponse,
  WorkoutsHeatmap as WorkoutsHeatmapResponse,
  RunningStats as RunningStatsResponse,
} from '@/lib/dashboard/workouts';

export type {
  HabitsToday as HabitsTodayResponse,
  HabitsConsistency as HabitsConsistencyResponse,
  HabitsStreaks as HabitsStreaksResponse,
  HabitsTrends as HabitsTrendsResponse,
  SleepQuality as SleepQualityResponse,
} from '@/lib/dashboard/habits';

export type {
  Goals as GoalsResponse,
  GoalProgressItem,
  GoalsProgress as GoalsProgressResponse,
} from '@/lib/dashboard/goals';

export type { Insights as InsightsResponse } from '@/lib/dashboard/insights';
export type { DiscoveredCorrelation } from '@/lib/insights/correlation-discovery';

export type { Location as LocationResponse } from '@/lib/dashboard/location';
export type {
  Country,
  Countries as CountriesResponse,
} from '@/lib/dashboard/countries';
export type { CoffeeConfig as CoffeeConfigResponse } from '@/lib/dashboard/settings';
