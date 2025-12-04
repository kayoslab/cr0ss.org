import { env } from '@/env';
import { sql } from '@/lib/db/client';
import { ZStravaActivity } from '@/lib/db/validation';

/**
 * Strava API client for fetching activities and managing authentication
 */

export interface StravaAuth {
  athlete_id: number;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

/**
 * Fetches the current Strava auth from the database
 */
export async function getStravaAuth(): Promise<StravaAuth | null> {
  const authRecords = await sql`
    SELECT athlete_id, access_token, refresh_token, expires_at
    FROM strava_auth
    LIMIT 1
  `;

  if (authRecords.length === 0) {
    return null;
  }

  return authRecords[0] as StravaAuth;
}

/**
 * Refreshes the access token if it's expired or about to expire
 */
export async function refreshAccessTokenIfNeeded(auth: StravaAuth): Promise<string> {
  const expiresAt = new Date(auth.expires_at);
  const needsRefresh = expiresAt < new Date(Date.now() + 5 * 60 * 1000); // Refresh if expires in < 5 minutes

  if (!needsRefresh) {
    return auth.access_token;
  }

  console.log('Refreshing Strava access token...');

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
      refresh_token: auth.refresh_token,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${errorText}`);
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
    WHERE athlete_id = ${auth.athlete_id}
  `;

  console.log('Access token refreshed successfully');

  return tokenData.access_token;
}

/**
 * Fetches a single activity from Strava by ID
 */
export async function fetchStravaActivity(activityId: number, accessToken: string) {
  const activityUrl = `https://www.strava.com/api/v3/activities/${activityId}`;
  const response = await fetch(activityUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch activity ${activityId}: ${response.statusText}`);
  }

  const activityData = await response.json();
  return ZStravaActivity.parse(activityData);
}

/**
 * Fetches recent activities from Strava
 * @param accessToken - Valid Strava access token
 * @param after - Unix timestamp to fetch activities after
 * @param perPage - Number of activities per page (max 200)
 */
export async function fetchStravaActivities(
  accessToken: string,
  after?: number,
  perPage: number = 30
) {
  const url = new URL('https://www.strava.com/api/v3/athlete/activities');
  url.searchParams.set('per_page', perPage.toString());

  if (after) {
    url.searchParams.set('after', after.toString());
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch activities: ${response.statusText}`);
  }

  const activitiesData = await response.json();

  // Validate each activity
  return activitiesData.map((activity: unknown) => ZStravaActivity.parse(activity));
}

/**
 * Updates the last sync timestamp for the athlete
 */
export async function updateLastSync(athleteId: number) {
  await sql`
    UPDATE strava_auth
    SET last_sync_at = now()
    WHERE athlete_id = ${athleteId}
  `;
}
