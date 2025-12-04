import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/env';
import { sql } from '@/lib/db/client';
import { ZStravaWebhookEvent, ZStravaActivity } from '@/lib/db/validation';
import { rateLimit } from '@/lib/rate/limit';
import { revalidateWorkouts } from '@/lib/cache/revalidate';

export const runtime = 'edge';

/**
 * GET /api/strava/webhook
 *
 * Webhook subscription verification endpoint.
 * Strava sends a GET request with a challenge parameter to verify the endpoint.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Verify the token matches our configured token
    if (mode === 'subscribe' && token === env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
      console.log('Strava webhook verification successful');

      // Respond with the challenge to complete verification
      return NextResponse.json({
        'hub.challenge': challenge,
      });
    }

    console.error('Strava webhook verification failed: invalid token');
    return NextResponse.json(
      { error: 'Invalid verification token' },
      { status: 403 }
    );

  } catch (error) {
    console.error('Strava webhook verification error:', error);
    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/strava/webhook
 *
 * Receives webhook events from Strava when activities are created, updated, or deleted.
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (webhooks shouldn't count against API limits)
    const rateLimitResult = await rateLimit(request, 'strava-webhook', {
      windowSec: 60,
      max: 100,
    });

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: { 'Retry-After': rateLimitResult.retryAfterSec.toString() }
        }
      );
    }

    const body = await request.json();

    // Validate webhook event structure
    const event = ZStravaWebhookEvent.parse(body);

    console.log('Received Strava webhook event:', {
      type: event.object_type,
      id: event.object_id,
      aspect: event.aspect_type,
      owner: event.owner_id,
    });

    // Only process activity events
    if (event.object_type !== 'activity') {
      return NextResponse.json({ ok: true, message: 'Event ignored (not an activity)' });
    }

    // Check if we have auth for this athlete
    const authRecords = await sql`
      SELECT athlete_id, access_token, refresh_token, expires_at
      FROM strava_auth
      WHERE athlete_id = ${event.owner_id}
      LIMIT 1
    `;

    if (authRecords.length === 0) {
      console.log('No auth found for athlete:', event.owner_id);
      return NextResponse.json({ ok: true, message: 'Athlete not connected' });
    }

    const auth = authRecords[0] as {
      athlete_id: number;
      access_token: string;
      refresh_token: string;
      expires_at: string;
    };

    // Handle different event types
    switch (event.aspect_type) {
      case 'create':
      case 'update':
        await handleActivitySync(event, auth);
        break;

      case 'delete':
        await handleActivityDelete(event);
        break;
    }

    // Revalidate workouts cache
    revalidateWorkouts();

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Strava webhook processing error:', error);

    // Return 200 to prevent Strava from retrying
    return NextResponse.json({ ok: false, error: 'Processing failed' });
  }
}

/**
 * Syncs an activity from Strava to the database
 */
async function handleActivitySync(
  event: { object_id: number; owner_id: number; aspect_type: string },
  auth: { athlete_id: number; access_token: string; refresh_token: string; expires_at: string }
) {
  try {
    // Check if token needs refresh
    const expiresAt = new Date(auth.expires_at);
    const needsRefresh = expiresAt < new Date(Date.now() + 5 * 60 * 1000); // Refresh if expires in < 5 minutes

    let accessToken = auth.access_token;

    if (needsRefresh) {
      const refreshResult = await refreshAccessToken(auth.athlete_id, auth.refresh_token);
      if (refreshResult) {
        accessToken = refreshResult.access_token;
      }
    }

    // Fetch activity details from Strava
    const activityUrl = `https://www.strava.com/api/v3/activities/${event.object_id}`;
    const activityResponse = await fetch(activityUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!activityResponse.ok) {
      throw new Error(`Failed to fetch activity: ${activityResponse.statusText}`);
    }

    const activityData = await activityResponse.json();
    const activity = ZStravaActivity.parse(activityData);

    // Transform Strava activity to workout format
    const workoutType = mapStravaTypeToWorkoutType(activity.type);
    const durationMin = Math.round(activity.moving_time / 60);
    const dateLocal = activity.start_date_local.split('T')[0];

    // Build details object with activity-specific metrics
    const details: Record<string, unknown> = {
      distance_m: activity.distance,
      elevation_gain_m: activity.total_elevation_gain,
    };

    if (activity.average_speed) details.avg_speed_mps = activity.average_speed;
    if (activity.max_speed) details.max_speed_mps = activity.max_speed;
    if (activity.average_heartrate) details.avg_heartrate = activity.average_heartrate;
    if (activity.max_heartrate) details.max_heartrate = activity.max_heartrate;
    if (activity.average_cadence) details.avg_cadence = activity.average_cadence;

    // Upsert workout (insert or update if exists)
    await sql`
      INSERT INTO workouts (
        date,
        workout_type,
        duration_min,
        details,
        notes,
        source,
        external_id,
        synced_at
      )
      VALUES (
        ${dateLocal},
        ${workoutType},
        ${durationMin},
        ${JSON.stringify(details)},
        ${activity.description || null},
        'strava',
        ${activity.id.toString()},
        now()
      )
      ON CONFLICT (external_id)
      DO UPDATE SET
        date = EXCLUDED.date,
        workout_type = EXCLUDED.workout_type,
        duration_min = EXCLUDED.duration_min,
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
        ${event.owner_id},
        ${event.object_id},
        ${event.aspect_type},
        'success'
      )
    `;

    console.log(`Successfully synced activity ${event.object_id}`);

  } catch (error) {
    console.error('Activity sync error:', error);

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
        ${event.owner_id},
        ${event.object_id},
        ${event.aspect_type},
        'error',
        ${error instanceof Error ? error.message : 'Unknown error'}
      )
    `;
  }
}

/**
 * Deletes an activity from the database
 */
async function handleActivityDelete(event: { object_id: number; owner_id: number }) {
  try {
    await sql`
      DELETE FROM workouts
      WHERE external_id = ${event.object_id.toString()}
        AND source = 'strava'
    `;

    // Log deletion
    await sql`
      INSERT INTO strava_sync_log (
        athlete_id,
        activity_id,
        event_type,
        status
      )
      VALUES (
        ${event.owner_id},
        ${event.object_id},
        'delete',
        'success'
      )
    `;

    console.log(`Successfully deleted activity ${event.object_id}`);

  } catch (error) {
    console.error('Activity deletion error:', error);

    await sql`
      INSERT INTO strava_sync_log (
        athlete_id,
        activity_id,
        event_type,
        status,
        error_message
      )
      VALUES (
        ${event.owner_id},
        ${event.object_id},
        'delete',
        'error',
        ${error instanceof Error ? error.message : 'Unknown error'}
      )
    `;
  }
}

/**
 * Refreshes an expired access token
 */
async function refreshAccessToken(athleteId: number, refreshToken: string) {
  try {
    const tokenUrl = 'https://www.strava.com/oauth/token';
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.STRAVA_CLIENT_ID,
        client_secret: env.STRAVA_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const tokenData = await response.json();

    // Update database with new tokens
    await sql`
      UPDATE strava_auth
      SET
        access_token = ${tokenData.access_token},
        refresh_token = ${tokenData.refresh_token},
        expires_at = ${new Date(tokenData.expires_at * 1000).toISOString()},
        updated_at = now()
      WHERE athlete_id = ${athleteId}
    `;

    console.log('Access token refreshed for athlete:', athleteId);

    return {
      access_token: tokenData.access_token,
      expires_at: tokenData.expires_at,
    };

  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

/**
 * Maps Strava activity types to our workout types
 */
function mapStravaTypeToWorkoutType(stravaType: string): string {
  const typeMap: Record<string, string> = {
    'Run': 'running',
    'TrailRun': 'running',
    'VirtualRun': 'running',
    'Ride': 'cycling',
    'VirtualRide': 'cycling',
    'Hike': 'hiking',
    'Walk': 'hiking',
    'RockClimbing': 'climbing',
    'Workout': 'strength',
    'WeightTraining': 'strength',
    'Rowing': 'rowing',
  };

  return typeMap[stravaType] || 'other';
}
