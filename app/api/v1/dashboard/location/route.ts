export const runtime = 'nodejs';

import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { dashboardTags, CACHE_DURATIONS } from '@/lib/api/cache';
import { getCurrentLocation } from '@/lib/db/location';
import { z } from 'zod';

/**
 * Response schema for location endpoint
 * Note: Using coerce to handle PostgreSQL DECIMAL types which return as strings
 */
const LocationResponseSchema = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  logged_at: z.string(),
  temp_celsius: z.coerce.number().nullable(),
  feels_like_celsius: z.coerce.number().nullable(),
  humidity: z.coerce.number().nullable(),
  cloudiness: z.coerce.number().nullable(),
  weather_main: z.string().nullable(),
  weather_description: z.string().nullable(),
});

export type LocationResponse = z.infer<typeof LocationResponseSchema>;

/**
 * GET /api/v1/dashboard/location
 *
 * Returns the most recent location data with weather information.
 *
 * Response:
 * - latitude: Latitude coordinate
 * - longitude: Longitude coordinate
 * - logged_at: Timestamp of location record
 * - temp_celsius: Temperature in Celsius
 * - feels_like_celsius: Feels-like temperature
 * - humidity: Humidity percentage
 * - cloudiness: Cloud cover percentage
 * - weather_main: Weather condition (e.g., "Clear", "Clouds")
 * - weather_description: Detailed weather description
 *
 * Cache:
 * - Duration: 5 minutes (FREQUENT)
 * - Tags: dashboard:location
 *
 * Example:
 * GET /api/v1/dashboard/location
 * {
 *   "latitude": 52.52,
 *   "longitude": 13.405,
 *   "logged_at": "2025-01-05T10:30:00Z",
 *   "temp_celsius": 8.5,
 *   "feels_like_celsius": 6.2,
 *   "humidity": 75,
 *   "cloudiness": 40,
 *   "weather_main": "Clouds",
 *   "weather_description": "scattered clouds"
 * }
 */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-location', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/location')
  .handle(async (request) => {
    try {
      // Fetch current location data
      const location = await getCurrentLocation();

      if (!location) {
        return apiError('No location data available', 404, undefined, 'NOT_FOUND');
      }

      // Transform database record to API response format
      const response = {
        latitude: location.latitude,
        longitude: location.longitude,
        logged_at: location.logged_at.toISOString(),
        temp_celsius: location.temp_celsius,
        feels_like_celsius: location.feels_like_celsius,
        humidity: location.humidity,
        cloudiness: location.cloudiness,
        weather_main: location.weather_main,
        weather_description: location.weather_description,
      };

      // Validate response schema
      const validatedResponse = LocationResponseSchema.parse(response);

      // Generate cache tags
      const tags = [dashboardTags('location')];

      // Return response with cache headers
      const apiResponse = apiSuccess(validatedResponse);

      // Add cache tags via Next.js headers
      apiResponse.headers.set('X-Cache-Tags', tags.join(','));

      // Add cache control header (5 minutes)
      apiResponse.headers.set(
        'Cache-Control',
        `s-maxage=${CACHE_DURATIONS.FREQUENT}, stale-while-revalidate`
      );

      return apiResponse;
    } catch (error) {
      console.error('Error fetching location:', error);

      if (error instanceof Error) {
        return apiError(
          'Failed to fetch location',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return apiError('An unexpected error occurred', 500, undefined, 'INTERNAL_ERROR');
    }
  });
