import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/env';
import { sql } from '@/lib/db/client';
import { assertSecret } from '@/lib/auth/secret';
import { rateLimit } from '@/lib/rate/limit';
import { revalidateWorkouts } from '@/lib/cache/revalidate';
import { assertStravaConfigured } from '@/lib/strava/config';

export const runtime = 'edge';

/**
 * POST /api/strava/auth/disconnect
 *
 * Revokes Strava authorization by calling Strava's deauthorize endpoint
 * and removing stored credentials from the database.
 */
export async function POST(request: NextRequest) {
  try {
    assertStravaConfigured();

    // Verify authentication
    assertSecret(request);

    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, 'strava-disconnect', {
      windowSec: 60,
      max: 5,
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

    // Fetch current credentials from database
    const authRecords = await sql`
      SELECT athlete_id, access_token
      FROM strava_auth
      LIMIT 1
    `;

    if (authRecords.length === 0) {
      return NextResponse.json(
        { error: 'No Strava connection found' },
        { status: 404 }
      );
    }

    const { athlete_id, access_token } = authRecords[0] as {
      athlete_id: number;
      access_token: string;
    };

    // Revoke access with Strava
    const deauthorizeUrl = 'https://www.strava.com/oauth/deauthorize';
    const deauthorizeResponse = await fetch(deauthorizeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token,
      }),
    });

    // Strava returns 200 on successful deauthorization
    if (!deauthorizeResponse.ok) {
      console.error('Strava deauthorization failed:', await deauthorizeResponse.text());
      // Continue anyway to clean up local data
    }

    // Delete credentials and sync log from database
    await sql`
      DELETE FROM strava_auth
      WHERE athlete_id = ${athlete_id}
    `;

    // Revalidate workouts cache
    revalidateWorkouts();

    return NextResponse.json({
      ok: true,
      message: 'Strava connection removed successfully',
    });

  } catch (error) {
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const err = error as { status: number; message: string };
      return NextResponse.json(
        { error: err.message },
        { status: err.status }
      );
    }

    console.error('Strava disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Strava' },
      { status: 500 }
    );
  }
}
