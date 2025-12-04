import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';
import { assertSecret } from '@/lib/auth/secret';
import { rateLimit } from '@/lib/rate/limit';
import { assertStravaConfigured } from '@/lib/strava/config';

export const runtime = 'edge';

/**
 * GET /api/strava/auth/status
 *
 * Checks if Strava is connected and returns connection details.
 */
export async function GET(request: NextRequest) {
  try {
    assertStravaConfigured();

    // Verify authentication
    assertSecret(request);

    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, 'strava-status', {
      windowSec: 60,
      max: 30,
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

    // Check for existing connection
    const authRecords = await sql`
      SELECT
        athlete_id,
        athlete_name,
        expires_at,
        last_sync_at,
        webhook_subscribed,
        created_at
      FROM strava_auth
      LIMIT 1
    `;

    if (authRecords.length === 0) {
      return NextResponse.json({
        connected: false,
      });
    }

    const auth = authRecords[0] as {
      athlete_id: number;
      athlete_name: string | null;
      expires_at: string;
      last_sync_at: string | null;
      webhook_subscribed: boolean;
      created_at: string;
    };

    // Check if token is expired
    const expiresAt = new Date(auth.expires_at);
    const isExpired = expiresAt < new Date();

    return NextResponse.json({
      connected: true,
      athlete: {
        id: auth.athlete_id,
        name: auth.athlete_name,
      },
      tokenExpired: isExpired,
      lastSync: auth.last_sync_at,
      webhookSubscribed: auth.webhook_subscribed,
      connectedSince: auth.created_at,
    });

  } catch (error) {
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const err = error as { status: number; message: string };
      return NextResponse.json(
        { error: err.message },
        { status: err.status }
      );
    }

    console.error('Strava status error:', error);
    return NextResponse.json(
      { error: 'Failed to check Strava status' },
      { status: 500 }
    );
  }
}
