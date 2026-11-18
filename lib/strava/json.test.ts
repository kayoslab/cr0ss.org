import { describe, it, expect } from 'vitest';
import { parseStravaJson, readStravaJson } from './json';
import {
  ZStravaActivity,
  ZStravaTokenResponse,
  ZStravaWebhookEvent,
} from '@/lib/db/validation';
import { transformStravaActivityToWorkout } from './transform';

// Above Number.MAX_SAFE_INTEGER: JSON.parse would round it to ...552000.
const BIG_ID = '18446744073709551615';
const NEXT_ID = '9007199254740993'; // MAX_SAFE_INTEGER + 2, rounds to ...992

const activityJson = (id: string) => `{
  "id": ${id},
  "id_str": "${id}",
  "name": "Morning Run",
  "type": "Run",
  "start_date": "2027-06-02T06:00:00Z",
  "start_date_local": "2027-06-02T08:00:00Z",
  "timezone": "(GMT+01:00) Europe/Berlin",
  "distance": 10012.4,
  "moving_time": 3000,
  "elapsed_time": 3100,
  "total_elevation_gain": 42.5,
  "athlete": { "id": ${BIG_ID} },
  "map": { "id": "a${id}" }
}`;

describe('parseStravaJson', () => {
  it('keeps IDs beyond the safe integer range exact', () => {
    expect(String(JSON.parse(`{"id":${NEXT_ID}}`).id)).not.toBe(NEXT_ID);
    expect(parseStravaJson(`{"id":${NEXT_ID}}`)).toEqual({ id: NEXT_ID });
    expect(parseStravaJson(`{"id":${BIG_ID}}`)).toEqual({ id: BIG_ID });
  });

  it('reads webhook object_id and owner_id as strings', () => {
    const event = parseStravaJson(
      `{"object_type":"activity","object_id":${BIG_ID},"aspect_type":"create","owner_id":${NEXT_ID},"subscription_id":120475,"event_time":1803456789}`
    );
    expect(event).toMatchObject({
      object_id: BIG_ID,
      owner_id: NEXT_ID,
      subscription_id: 120475,
      event_time: 1803456789,
    });
  });

  it('converts IDs in nested objects and arrays', () => {
    const [activity] = parseStravaJson(`[${activityJson(BIG_ID)}]`) as [
      { id: string; athlete: { id: string }; map: { id: string } },
    ];
    expect(activity.id).toBe(BIG_ID);
    expect(activity.athlete.id).toBe(BIG_ID);
    expect(activity.map.id).toBe(`a${BIG_ID}`);
  });

  it('leaves other numbers alone', () => {
    expect(parseStravaJson('{"distance":10012.4,"moving_time":3000}')).toEqual({
      distance: 10012.4,
      moving_time: 3000,
    });
  });

  it('reads from a Response body', async () => {
    const response = new Response(`{"id":${BIG_ID}}`);
    expect(await readStravaJson(response)).toEqual({ id: BIG_ID });
  });
});

describe('Strava schemas with 64-bit IDs', () => {
  it('validates an activity and keeps its ID as external_id', () => {
    const activity = ZStravaActivity.parse(
      parseStravaJson(activityJson(BIG_ID))
    );
    expect(activity.id).toBe(BIG_ID);
    expect(transformStravaActivityToWorkout(activity).external_id).toBe(BIG_ID);
  });

  it('validates a webhook event', () => {
    const event = ZStravaWebhookEvent.parse(
      parseStravaJson(
        `{"object_type":"activity","object_id":${BIG_ID},"aspect_type":"delete","owner_id":${NEXT_ID},"subscription_id":1,"event_time":1803456789}`
      )
    );
    expect(event.object_id).toBe(BIG_ID);
    expect(event.owner_id).toBe(NEXT_ID);
  });

  it('validates an OAuth token response', () => {
    const token = ZStravaTokenResponse.parse(
      parseStravaJson(
        `{"token_type":"Bearer","expires_at":1803456789,"expires_in":21600,"refresh_token":"r","access_token":"a","athlete":{"id":${BIG_ID},"firstname":"Simon"}}`
      )
    );
    expect(token.athlete.id).toBe(BIG_ID);
  });

  it('rejects IDs parsed as plain numbers', () => {
    expect(
      ZStravaActivity.safeParse(JSON.parse(activityJson('12345678901'))).success
    ).toBe(false);
  });
});
