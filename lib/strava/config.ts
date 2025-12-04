import { env } from '@/env';

/**
 * Check if Strava integration is configured
 */
export function isStravaConfigured(): boolean {
  return !!(
    env.STRAVA_CLIENT_ID &&
    env.STRAVA_CLIENT_SECRET &&
    env.STRAVA_WEBHOOK_VERIFY_TOKEN
  );
}

/**
 * Assert that Strava is configured, throw error if not
 */
export function assertStravaConfigured(): void {
  if (!isStravaConfigured()) {
    throw new Error('Strava integration is not configured. Please set STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_WEBHOOK_VERIFY_TOKEN environment variables.');
  }
}

/**
 * Get Strava configuration (throws if not configured)
 */
export function getStravaConfig() {
  assertStravaConfigured();

  return {
    clientId: env.STRAVA_CLIENT_ID!,
    clientSecret: env.STRAVA_CLIENT_SECRET!,
    webhookVerifyToken: env.STRAVA_WEBHOOK_VERIFY_TOKEN!,
  };
}
