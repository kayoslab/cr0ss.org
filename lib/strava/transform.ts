import { StravaActivity } from '@/lib/db/validation';
import { WorkoutUpsert } from '@/lib/db/validation';

/**
 * Maps Strava activity types to our workout types
 */
export function mapStravaTypeToWorkoutType(stravaType: string): string {
  const typeMap: Record<string, string> = {
    'Run': 'running',
    'TrailRun': 'running',
    'VirtualRun': 'running',
    'Ride': 'cycling',
    'VirtualRide': 'cycling',
    'MountainBikeRide': 'cycling',
    'GravelRide': 'cycling',
    'EBikeRide': 'cycling',
    'Hike': 'hiking',
    'Walk': 'hiking',
    'RockClimbing': 'climbing',
    'IceClimbing': 'climbing',
    'Bouldering': 'bouldering',
    'Workout': 'strength',
    'WeightTraining': 'strength',
    'Crossfit': 'strength',
    'Rowing': 'rowing',
    'Swim': 'other',
    'Yoga': 'other',
  };

  return typeMap[stravaType] || 'other';
}

/**
 * Estimates workout intensity based on average heart rate
 * This is a simplified estimation - actual intensity depends on individual max HR
 */
export function estimateIntensity(averageHR?: number): 'low' | 'moderate' | 'high' | 'max' | undefined {
  if (!averageHR) return undefined;

  // Rough zones based on typical HR ranges (assuming max HR ~190)
  if (averageHR < 130) return 'low';
  if (averageHR < 150) return 'moderate';
  if (averageHR < 170) return 'high';
  return 'max';
}

/**
 * Calculates perceived effort based on pace and elevation
 * This is a heuristic - perceived effort is subjective
 */
export function estimatePerceivedEffort(
  avgSpeed?: number,
  elevationGain?: number,
  duration?: number
): number | undefined {
  // If no data, we can't estimate
  if (!avgSpeed && !elevationGain) return undefined;

  let effort = 5; // Base effort (moderate)

  // Adjust for speed (higher speed = more effort)
  if (avgSpeed) {
    // avg_speed is in m/s
    // For running: >4 m/s (~15 km/h) is high effort
    // For cycling: >8 m/s (~29 km/h) is high effort
    if (avgSpeed > 6) effort += 2;
    else if (avgSpeed > 4) effort += 1;
    else if (avgSpeed < 2) effort -= 1;
  }

  // Adjust for elevation gain (more climbing = more effort)
  if (elevationGain && duration) {
    const elevPerHour = (elevationGain / duration) * 3600;
    if (elevPerHour > 300) effort += 2;
    else if (elevPerHour > 150) effort += 1;
  }

  // Clamp between 1 and 10
  return Math.max(1, Math.min(10, effort));
}

/**
 * Transforms a Strava activity into our workout format
 */
export function transformStravaActivityToWorkout(activity: StravaActivity): WorkoutUpsert {
  const workoutType = mapStravaTypeToWorkoutType(activity.type);
  const durationMin = Math.round(activity.moving_time / 60);
  const dateLocal = activity.start_date_local.split('T')[0];

  // Build details object with activity-specific metrics
  const details: Record<string, unknown> = {
    distance_m: activity.distance,
    elevation_gain_m: activity.total_elevation_gain,
    elapsed_time_sec: activity.elapsed_time,
    moving_time_sec: activity.moving_time,
    name: activity.name,
  };

  // Add optional metrics
  if (activity.average_speed) details.avg_speed_mps = activity.average_speed;
  if (activity.max_speed) details.max_speed_mps = activity.max_speed;
  if (activity.average_heartrate) details.avg_heartrate = activity.average_heartrate;
  if (activity.max_heartrate) details.max_heartrate = activity.max_heartrate;
  if (activity.average_cadence) details.avg_cadence = activity.average_cadence;
  if (activity.elev_high) details.elev_high_m = activity.elev_high;
  if (activity.elev_low) details.elev_low_m = activity.elev_low;
  if (activity.kudos_count) details.kudos = activity.kudos_count;

  // Calculate pace for running activities (min/km)
  if (workoutType === 'running' && activity.distance > 0) {
    const paceSecPerKm = (activity.moving_time / (activity.distance / 1000));
    details.pace_sec_per_km = Math.round(paceSecPerKm);
  }

  // Calculate average power for cycling (if available)
  if ('average_watts' in activity && typeof activity.average_watts === 'number') {
    details.avg_watts = activity.average_watts;
  }

  const intensity = estimateIntensity(activity.average_heartrate);
  const perceivedEffort = estimatePerceivedEffort(
    activity.average_speed,
    activity.total_elevation_gain,
    activity.moving_time
  );

  return {
    date: dateLocal,
    workout_type: workoutType as WorkoutUpsert['workout_type'],
    duration_min: durationMin,
    intensity,
    perceived_effort: perceivedEffort,
    details,
    notes: activity.description || undefined,
    source: 'strava',
    external_id: activity.id.toString(),
  };
}

/**
 * Formats distance in meters to human-readable format
 */
export function formatDistance(distanceM: number, workoutType: string): string {
  if (workoutType === 'running' || workoutType === 'hiking') {
    // Use km for running/hiking
    return `${(distanceM / 1000).toFixed(2)} km`;
  }

  // Use km for other activities too
  return `${(distanceM / 1000).toFixed(1)} km`;
}

/**
 * Formats pace in seconds per km to mm:ss format
 */
export function formatPace(paceSecPerKm: number): string {
  const minutes = Math.floor(paceSecPerKm / 60);
  const seconds = Math.round(paceSecPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
}
