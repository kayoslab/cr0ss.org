import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { env } from '@/env';

export async function POST(request: Request) {
  const requestHeaders = new Headers(request.headers);
  const secret = requestHeaders.get('token');

  if (secret !== env.LOCATION_API_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const body = await request.json();

  const lat = body.lat;
  const lon = body.lon;

  if (!lat || !lon) {
    return NextResponse.json({ message: 'No geo position provided' }, { status: 400 });
  }

  const location = { lat, lon };

  // Revalidate the stored geo location if difference is significant

  return NextResponse.json({ revalidated: true, now: Date.now() });
}