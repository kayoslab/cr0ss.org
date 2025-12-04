import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/env';
import { sql } from '@/lib/db/client';
import { ZStravaTokenResponse } from '@/lib/db/validation';
import { rateLimit } from '@/lib/rate/limit';
import { revalidateWorkouts } from '@/lib/cache/revalidate';

export const runtime = 'edge';

/**
 * GET /api/strava/auth/callback
 *
 * OAuth callback endpoint that receives the authorization code from Strava
 * and exchanges it for access and refresh tokens.
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, 'strava-callback', {
      windowSec: 60,
      max: 10,
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

    // Extract authorization code from query params
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle user denial
    if (error === 'access_denied') {
      return NextResponse.json(
        { error: 'Authorization denied by user' },
        { status: 403 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const tokenUrl = 'https://www.strava.com/oauth/token';
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.STRAVA_CLIENT_ID,
        client_secret: env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Strava token exchange failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to exchange authorization code' },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('Received token data from Strava');

    // Validate response structure
    let validatedData;
    try {
      validatedData = ZStravaTokenResponse.parse(tokenData);
      console.log('Token data validated successfully');
    } catch (validationError) {
      console.error('Token validation failed:', validationError);
      console.error('Token data:', JSON.stringify(tokenData, null, 2));
      throw validationError;
    }

    // Store tokens in database
    console.log('Storing tokens in database for athlete:', validatedData.athlete.id);
    const athleteName = `${validatedData.athlete.firstname || ''} ${validatedData.athlete.lastname || ''}`.trim();
    await sql`
      INSERT INTO strava_auth (
        athlete_id,
        athlete_name,
        access_token,
        refresh_token,
        expires_at,
        token_type,
        scopes
      )
      VALUES (
        ${validatedData.athlete.id},
        ${athleteName},
        ${validatedData.access_token},
        ${validatedData.refresh_token},
        ${new Date(validatedData.expires_at * 1000).toISOString()},
        ${validatedData.token_type},
        ${['read', 'activity:read_all']}
      )
      ON CONFLICT (athlete_id)
      DO UPDATE SET
        athlete_name = EXCLUDED.athlete_name,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        token_type = EXCLUDED.token_type,
        scopes = EXCLUDED.scopes,
        updated_at = now()
    `;
    console.log('Tokens stored successfully');

    // Revalidate workouts cache
    revalidateWorkouts();

    console.log('Authorization complete, returning success');
    return NextResponse.json({
      ok: true,
      athlete: {
        id: validatedData.athlete.id,
        name: `${validatedData.athlete.firstname || ''} ${validatedData.athlete.lastname || ''}`.trim(),
      },
    });

  } catch (error) {
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const err = error as { status: number; message: string };
      return NextResponse.json(
        { error: err.message },
        { status: err.status }
      );
    }

    console.error('Strava callback error:', error);
    return NextResponse.json(
      { error: 'Failed to complete authorization' },
      { status: 500 }
    );
  }
}
