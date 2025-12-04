import { NextRequest, NextResponse } from 'next/server';
import { assertSecret } from '@/lib/auth/secret';
import { rateLimit } from '@/lib/rate/limit';
import { getStravaConfig } from '@/lib/strava/config';

export const runtime = 'edge';

/**
 * GET /api/strava/auth/connect
 *
 * Generates and returns the Strava OAuth authorization URL.
 * The user should be redirected to this URL to authorize the application.
 */
export async function GET(request: NextRequest) {
  try {
    // Get Strava config (throws if not configured)
    const config = getStravaConfig();

    // Verify authentication
    assertSecret(request);

    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, 'strava-connect', {
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

    // Build OAuth URL
    const callbackUrl = new URL('/api/strava/auth/callback', request.url);

    const authUrl = new URL('https://www.strava.com/oauth/authorize');
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', callbackUrl.toString());
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('approval_prompt', 'auto');
    authUrl.searchParams.set('scope', 'read,activity:read_all');

    return NextResponse.json({
      authUrl: authUrl.toString(),
    });

  } catch (error) {
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const err = error as { status: number; message: string };
      return NextResponse.json(
        { error: err.message },
        { status: err.status }
      );
    }

    console.error('Strava connect error:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}
