/**
 * TypeScript types for Dashboard API responses
 *
 * This file contains type definitions for all API responses from the
 * /api/v1/dashboard/* endpoints to ensure type safety in frontend components.
 */

// ============================================================================
// Coffee API Types
// ============================================================================

export interface CoffeeSummaryResponse {
  date: string;
  cups: number;
  brewMethods: Array<{ type: string; count: number }>;
}

export interface CoffeeTimelineResponse {
  timeline: Array<{
    period: string;
    cups_count: number;
    avg_caffeine_mg: number;
  }>;
  total_cups: number;
  avg_cups_per_day: number;
}

export interface CaffeineCurveResponse {
  date: string;
  series: Array<{
    time: string;
    intake_mg: number;
    body_mg: number;
  }>;
  body_profile: {
    half_life_hours: number;
    sensitivity: number;
    bioavailability: number;
  };
}

// ============================================================================
// Workouts API Types
// ============================================================================

export interface WorkoutsSummaryResponse {
  period: string;
  workout_types: Array<{
    type: string;
    count: number;
    total_duration_min: number;
    avg_duration_min: number;
  }>;
  total_workouts: number;
  total_duration_min: number;
  streaks: {
    current: number;
    longest: number;
  };
}

export interface WorkoutsHeatmapResponse {
  heatmap: Array<{
    date: string;
    duration_min: number;
    distance_km?: number;
  }>;
  stats: {
    active_days: number;
    total_duration_min: number;
    avg_duration_min: number;
  };
}

export interface RunningStatsResponse {
  period: string;
  total_runs: number;
  total_distance_km: number;
  total_duration_min: number;
  avg_pace_sec_per_km: number;
  personal_records: {
    longest_run_km: number;
    longest_run_date: string;
    fastest_pace_sec_per_km: number;
    fastest_pace_date: string;
  };
  monthly_progress?: {
    target_km: number;
    current_km: number;
    remaining_km: number;
    progress_pct: number;
  };
}

// ============================================================================
// Habits API Types
// ============================================================================

export interface HabitsTodayResponse {
  date: string;
  steps: number;
  reading_minutes: number;
  outdoor_minutes: number;
  writing_minutes: number;
  coding_minutes: number;
  focus_minutes: number;
  sleep_score?: number;
}

export interface HabitsConsistencyResponse {
  period_days: number;
  habits: Array<{
    name: string;
    target: number;
    days_met: number;
    consistency_pct: number;
  }>;
}

export interface HabitsStreaksResponse {
  streaks: Array<{
    habit: string;
    current: number;
    longest: number;
    target: number;
  }>;
}

export interface HabitsTrendsResponse {
  trends: Array<{
    date: string;
    values: Record<string, number>;
  }>;
}

export interface SleepQualityResponse {
  data: Array<{
    date: string;
    sleep_score: number;
    prev_caffeine_mg: number;
    prev_day_workout: boolean;
  }>;
}

// ============================================================================
// Goals API Types
// ============================================================================

export interface GoalsResponse {
  daily: Record<string, number>;
  monthly: Record<string, number>;
}

export interface GoalProgressItem {
  goal: string;
  target: number;
  current: number;
  progress_pct: number;
  unit: string;
}

export interface GoalsProgressResponse {
  daily?: GoalProgressItem[];
  monthly?: GoalProgressItem[];
}

// ============================================================================
// Insights API Types
// ============================================================================

// Re-export correlation types from the source module to ensure type compatibility
export type { DiscoveredCorrelation } from '@/lib/insights/correlation-discovery';

export interface InsightsResponse {
  correlations: Array<import('@/lib/insights/correlation-discovery').DiscoveredCorrelation>;
  metadata: {
    days_analyzed: number;
    min_correlation: number;
    p_value_threshold: number;
  };
}

// ============================================================================
// Location API Types
// ============================================================================

export interface LocationResponse {
  latitude: number;
  longitude: number;
  logged_at: string;
  temp_celsius: number | null;
  feels_like_celsius: number | null;
  humidity: number | null;
  cloudiness: number | null;
  weather_main: string | null;
  weather_description: string | null;
}

// ============================================================================
// Countries API Types
// ============================================================================

export interface Country {
  id: string;
  name: string;
  path: string;
  visited: boolean;
  lastVisited?: string;
}

export interface CountriesResponse {
  countries: Country[];
  total: number;
  visited_count: number;
}

// ============================================================================
// Settings API Types
// ============================================================================

export interface CoffeeConfigItem {
  id: string;
  name: string;
  roaster: string;
}

export interface CoffeeConfigResponse {
  items: CoffeeConfigItem[];
}
