/**
 * Most recent logged location, with the weather captured alongside it.
 */
import { z } from 'zod';
import { cached } from '@/lib/cache/cached';
import { tags, CACHE_LIFE } from '@/lib/cache/tags';
import { getCurrentLocation } from '@/lib/db/location';

// `coerce` because PostgreSQL DECIMAL columns arrive as strings.
export const LocationSchema = z.object({
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
export type Location = z.infer<typeof LocationSchema>;

async function queryLocation(): Promise<Location | null> {
  const location = await getCurrentLocation();
  if (!location) return null;
  return LocationSchema.parse({
    latitude: location.latitude,
    longitude: location.longitude,
    logged_at: location.logged_at.toISOString(),
    temp_celsius: location.temp_celsius,
    feels_like_celsius: location.feels_like_celsius,
    humidity: location.humidity,
    cloudiness: location.cloudiness,
    weather_main: location.weather_main,
    weather_description: location.weather_description,
  });
}

export const getLocation = cached('dashboard-location', queryLocation, {
  tags: () => [tags.dashboard.location],
  revalidate: CACHE_LIFE.frequent,
});
