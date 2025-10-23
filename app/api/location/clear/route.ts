export const runtime = "edge";

import { kv } from "@vercel/kv";
import { assertSecret } from '@/lib/auth/secret';
import { revalidateDashboard } from '@/lib/cache/revalidate';
import { apiSuccess } from '@/lib/api/responses';

const LOCATION_KEY = 'GEOLOCATION';

export async function POST(request: Request) {
  try {
    assertSecret(request);

    const oldLocation = await kv.get<{ lat: number; lon: number }>(LOCATION_KEY);
    await kv.del(LOCATION_KEY);
    revalidateDashboard();

    return apiSuccess({
      cleared: true,
      oldLocation,
      now: Date.now()
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    throw error;
  }
}
