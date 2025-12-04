import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';
import { assertSecret } from '@/lib/auth/secret';
import { rateLimit } from '@/lib/rate/limit';
import { revalidateWorkouts } from '@/lib/cache/revalidate';
import {
  getStravaAuth,
  refreshAccessTokenIfNeeded,
  fetchStravaActivities,
  updateLastSync,
} from '@/lib/strava/client';
import { transformStravaActivityToWorkout } from '@/lib/strava/transform';

export const runtime = 'edge';

/**
 * POST /api/strava/sync
 *
 * Manually triggers a sync of recent Strava activities.
 * This is useful for:
 * - Initial sync after connecting Strava
 * - Catching up on missed activities (if webhook was down)
 * - User-initiated sync
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    assertSecret(request);

    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, 'strava-sync', {
      windowSec: 300, // 5 minutes
      max: 3, // Max 3 syncs per 5 minutes
    });

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before syncing again.' },
        {
          status: 429,
          headers: { 'Retry-After': rateLimitResult.retryAfterSec.toString() }
        }
      );
    }

    // Get Strava auth
    const auth = await getStravaAuth();

    if (!auth) {
      return NextResponse.json(
        { error: 'Strava not connected' },
        { status: 404 }
      );
    }

    // Refresh token if needed
    const accessToken = await refreshAccessTokenIfNeeded(auth);

    // Parse request body for sync options
    const body = await request.json().catch(() => ({}));
    const daysBack = body.daysBack || 30; // Default to last 30 days

    // Calculate "after" timestamp (activities after this date)
    const afterTimestamp = Math.floor(Date.now() / 1000) - (daysBack * 24 * 60 * 60);

    console.log(`Syncing Strava activities from last ${daysBack} days...`);

    // Fetch recent activities
    const activities = await fetchStravaActivities(accessToken, afterTimestamp, 100);

    console.log(`Found ${activities.length} activities to sync`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    // Process each activity
    for (const activity of activities) {
      try {
        // Transform to workout format
        const workout = transformStravaActivityToWorkout(activity);

        // Upsert workout (insert or update if exists)
        await sql`
          INSERT INTO workouts (
            date,
            workout_type,
            duration_min,
            intensity,
            perceived_effort,
            details,
            notes,
            source,
            external_id,
            synced_at
          )
          VALUES (
            ${workout.date},
            ${workout.workout_type},
            ${workout.duration_min},
            ${workout.intensity || null},
            ${workout.perceived_effort || null},
            ${JSON.stringify(workout.details)},
            ${workout.notes || null},
            'strava',
            ${workout.external_id},
            now()
          )
          ON CONFLICT (external_id)
          DO UPDATE SET
            date = EXCLUDED.date,
            workout_type = EXCLUDED.workout_type,
            duration_min = EXCLUDED.duration_min,
            intensity = EXCLUDED.intensity,
            perceived_effort = EXCLUDED.perceived_effort,
            details = EXCLUDED.details,
            notes = EXCLUDED.notes,
            synced_at = now()
        `;

        // Log sync success
        await sql`
          INSERT INTO strava_sync_log (
            athlete_id,
            activity_id,
            event_type,
            status
          )
          VALUES (
            ${auth.athlete_id},
            ${activity.id},
            'create',
            'success'
          )
        `;

        synced++;

      } catch (error) {
        console.error(`Failed to sync activity ${activity.id}:`, error);

        // Log sync error
        await sql`
          INSERT INTO strava_sync_log (
            athlete_id,
            activity_id,
            event_type,
            status,
            error_message
          )
          VALUES (
            ${auth.athlete_id},
            ${activity.id},
            'create',
            'error',
            ${error instanceof Error ? error.message : 'Unknown error'}
          )
        `;

        errors++;
      }
    }

    // Update last sync timestamp
    await updateLastSync(auth.athlete_id);

    // Revalidate workouts cache
    revalidateWorkouts();

    return NextResponse.json({
      ok: true,
      synced,
      skipped,
      errors,
      total: activities.length,
    });

  } catch (error) {
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const err = error as { status: number; message: string };
      return NextResponse.json(
        { error: err.message },
        { status: err.status }
      );
    }

    console.error('Strava sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync activities' },
      { status: 500 }
    );
  }
}
