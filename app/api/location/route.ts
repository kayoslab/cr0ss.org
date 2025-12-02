import { assertSecret } from '@/lib/auth/secret';
import { revalidateDashboard } from '@/lib/cache/revalidate';
import { apiSuccess, validationError } from '@/lib/api/responses';
import { fetchWeather } from '@/lib/services/openweathermap';
import { insertLocationHistory, getLatestLocation } from '@/lib/db/location';

const LOCATION_THRESHOLD_KM = 150;

export async function POST(request: Request) {
  try {
    assertSecret(request);

    const storedLocationRecord = await getLatestLocation();
    const storedLocation = storedLocationRecord
      ? { lat: storedLocationRecord.latitude, lon: storedLocationRecord.longitude }
      : null;
    const body = await request.json();

    // Parse lat/lon as numbers (handles both string and number input)
    const lat = typeof body.lat === 'string' ? parseFloat(body.lat) : body.lat;
    const lon = typeof body.lon === 'string' ? parseFloat(body.lon) : body.lon;

    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
      return validationError('Invalid coordinates', {
        lat: typeof lat === 'number' && !isNaN(lat) ? 'valid' : 'must be a valid number',
        lon: typeof lon === 'number' && !isNaN(lon) ? 'valid' : 'must be a valid number',
      });
    }

    const currentLocation = { lat, lon };

    // Fetch weather data for the current location
    const weather = await fetchWeather(lat, lon);

    // Always store location with weather in database for history
    await insertLocationHistory(lat, lon, weather);

    if (!storedLocation) {
      revalidateDashboard();
      return apiSuccess({ revalidated: true, now: Date.now(), weather: weather ? 'fetched' : 'unavailable' });
    }

    const distance = distanceInKmBetweenEarthCoordinates(
      storedLocation.lat,
      storedLocation.lon,
      currentLocation.lat,
      currentLocation.lon
    );

    if (distance > LOCATION_THRESHOLD_KM) {
      revalidateDashboard();
      return apiSuccess({ revalidated: true, now: Date.now(), distance, weather: weather ? 'fetched' : 'unavailable' });
    }

    return apiSuccess({ revalidated: false, now: Date.now(), distance, weather: weather ? 'fetched' : 'unavailable' });
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