import { NextResponse } from 'next/server';
import { kv } from "@vercel/kv";
import { env } from '@/env';

export async function POST(request: Request) {
  const requestHeaders = new Headers(request.headers);
  const secret = requestHeaders.get('token');
  const locationKey = 'GEOLOCATION';
  const locationThreshold = 150;

  if (secret !== env.LOCATION_API_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const storedLocation = await kv.get<{ lat: number; lon: number }[]>(locationKey);
  const body = await request.json();

  const lat = body.lat;
  const lon = body.lon;

  if (!lat || !lon) {
    return NextResponse.json({ message: 'No geo position provided' }, { status: 400 });
  }

  const currentLocation = { lat: lat, lon: lon };

  if (!storedLocation) {
    await kv.set(locationKey, currentLocation);

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } else {
    const storedLat = storedLocation[0].lat;
    const storedLon = storedLocation[0].lon;

    const distance = distanceInKmBetweenEarthCoordinates(
      storedLat,
      storedLon,
      currentLocation.lat,
      currentLocation.lon
    );

    if (distance > locationThreshold) {
      await kv.set(locationKey, currentLocation);
      return NextResponse.json({ revalidated: true, now: Date.now() });
    } else {
      return NextResponse.json({ revalidated: false, now: Date.now() });
    }
  }
}

function degreesToRadians(degrees: number) {
  return degrees * Math.PI / 180;
}

function distanceInKmBetweenEarthCoordinates(lat1: number, lon1: number, lat2: number, lon2: number) {
  var earthRadiusKm = 6371;

  var dLat = degreesToRadians(lat2-lat1);
  var dLon = degreesToRadians(lon2-lon1);

  lat1 = degreesToRadians(lat1);
  lat2 = degreesToRadians(lat2);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return earthRadiusKm * c;
}