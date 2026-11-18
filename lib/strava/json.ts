/**
 * Lossless JSON parsing for Strava API responses and webhook payloads.
 *
 * From June 2027 Strava issues 64-bit activity and athlete IDs, which
 * JSON.parse would silently round once they exceed Number.MAX_SAFE_INTEGER.
 * Webhook events only carry numeric object_id/owner_id (no *_str variant),
 * so the IDs are read from the raw JSON text instead and kept as strings.
 */

const ID_KEYS = new Set(['id', 'object_id', 'owner_id']);

// JSON.parse source text access (Node 21+); not yet in the TypeScript lib.
type ReviverContext = { source?: string };

export function parseStravaJson(text: string): unknown {
  return JSON.parse(text, function (
    this: unknown,
    key: string,
    value: unknown,
    context?: ReviverContext
  ) {
    if (!ID_KEYS.has(key) || typeof value !== 'number') return value;
    if (context?.source !== undefined) return context.source;
    if (Number.isSafeInteger(value)) return String(value);
    throw new Error(`Cannot read Strava ${key} without losing precision`);
  } as (key: string, value: unknown) => unknown);
}

export async function readStravaJson(
  body: Pick<Response, 'text'>
): Promise<unknown> {
  return parseStravaJson(await body.text());
}
