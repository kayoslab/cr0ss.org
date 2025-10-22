export const runtime = "edge";

import { kv } from "@vercel/kv";
import { assertSecret } from '@/lib/auth/secret';
import { revalidateDashboard } from '@/lib/cache/revalidate';
import { apiSuccess, validationError } from '@/lib/api/responses';

const LOCATION_KEY = 'GEOLOCATION';
const LOCATION_THRESHOLD_KM = 150;

export async function POST(request: Request) {
  try {
    // Use standard auth (same as other API routes)
    assertSecret(request);

    const storedLocation = await kv.get<{ lat: number; lon: number }>(LOCATION_KEY);
    const body = await request.json();

    const lat = body.lat;
    const lon = body.lon;

    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
      return validationError('Invalid coordinates', {
        lat: typeof lat === 'number' ? 'valid' : 'must be a number',
        lon: typeof lon === 'number' ? 'valid' : 'must be a number',
      });
    }

    const currentLocation = { lat, lon };

    if (!storedLocation) {
      await kv.set(LOCATION_KEY, currentLocation);
      revalidateDashboard();
      return apiSuccess({ revalidated: true, now: Date.now() });
    }

    const distance = distanceInKmBetweenEarthCoordinates(
      storedLocation.lat,
      storedLocation.lon,
      currentLocation.lat,
      currentLocation.lon
    );

    if (distance > LOCATION_THRESHOLD_KM) {
      await kv.set(LOCATION_KEY, currentLocation);
      revalidateDashboard();
      return apiSuccess({ revalidated: true, now: Date.now(), distance });
    }

    return apiSuccess({ revalidated: false, now: Date.now(), distance });
  } catch (error) {
    // assertSecret throws a Response on auth failure
    if (error instanceof Response) {
      return error;
    }
    throw error;
  }
}

function degreesToRadians(degrees: number) {
  return degrees * Math.PI / 180;
}

function distanceInKmBetweenEarthCoordinates(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusKm = 6371;

  const dLat = degreesToRadians(lat2-lat1);
  const dLon = degreesToRadians(lon2-lon1);

  lat1 = degreesToRadians(lat1);
  lat2 = degreesToRadians(lat2);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return earthRadiusKm * c;
}