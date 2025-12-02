# Location Architecture Refactor

## Overview

Refactored the location tracking system to eliminate Vercel KV dependency and use a database-first approach with a view for current location display.

## Changes Made

### 1. Database Schema

**New Migration**: `db/migrations/011_current_location_view.sql`

Created a database view `current_location` that returns the most recent location from the `location_history` table:

```sql
CREATE VIEW current_location AS
SELECT *
FROM location_history
ORDER BY logged_at DESC
LIMIT 1;
```

**Benefits:**
- No separate storage needed for "current" location
- All location updates are stored as history
- Current location is always the latest entry
- Enables future analytics on location history

### 2. Location API Changes

**Updated**: `app/api/location/route.ts`
- ✅ Removed `@vercel/kv` dependency
- ✅ Uses `getLatestLocation()` from database to check distance threshold
- ✅ Uses `insertLocationHistory()` to store every location update
- ✅ No longer needs to manage separate "current location" storage

**Removed**: `app/api/location/clear/route.ts`
- ❌ Deleted endpoint - no longer needed
- ❌ Deleted tests - no longer needed
- Location history is permanent; no need to clear

### 3. Database Functions

**Updated**: `lib/db/location.ts`

Added new function:
```typescript
export async function getCurrentLocation(): Promise<LocationHistoryRecord | null> {
  const rows = await sql`SELECT * FROM current_location`;
  return (rows[0] as LocationHistoryRecord) || null;
}
```

Kept existing functions:
- `insertLocationHistory()` - Store location with weather data
- `getLatestLocation()` - Get most recent location (used by API for distance checks)
- `getLocationHistory()` - Get location history in date range
- `getWeatherStats()` - Get aggregated weather statistics

### 4. Dashboard Pages Updated

**Updated pages to use `getCurrentLocation()`:**
- `app/dashboard/page.tsx` - Overview page
- `app/dashboard/travel/page.tsx` - Travel page

Both now use the database view instead of directly querying location_history.

### 5. Tests Updated

**Updated**: `app/api/location/route.test.ts`
- ✅ 22 tests passing
- ✅ Mocks database functions instead of KV
- ✅ Tests all edge cases (equator, poles, null island, etc.)

**Removed**: `app/api/location/clear/route.test.ts`
- ❌ No longer needed

### 6. Documentation Updated

**Updated**: `docs/api/README.md`
- Removed `/location/clear` endpoint reference
- Updated examples

**Updated**: `docs/api/openapi.yaml`
- Removed `/location/clear` endpoint definition
- Validated successfully ✅

## Architecture Benefits

### Before (KV-based)
```
POST /location → Check KV → Update KV → Insert DB history
GET current location → Read from KV
POST /location/clear → Delete from KV
```

**Issues:**
- Dual storage (KV + DB)
- Race conditions possible
- Need to manage clearing
- Current location could be out of sync with history

### After (Database View)
```
POST /location → Check latest from DB → Insert new entry
GET current location → Read from current_location view
```

**Benefits:**
- ✅ Single source of truth (database)
- ✅ No race conditions
- ✅ Complete location history preserved
- ✅ Current location always consistent
- ✅ Simpler architecture
- ✅ No external dependencies (KV)

## Migration Path

To apply the database view on existing deployments:

```bash
# Run the migration
psql $DATABASE_URL < db/migrations/011_current_location_view.sql
```

The view will automatically work with existing `location_history` data.

## API Behavior

### Location Update (POST /api/location)

**Behavior:**
1. Receives coordinates (lat, lon)
2. Fetches weather data from OpenWeatherMap
3. Inserts new record into `location_history`
4. Checks distance from previous location
5. If distance > 150km, triggers dashboard revalidation

**Response:**
```json
{
  "revalidated": true,
  "now": 1733155200000,
  "distance": 504.2,
  "weather": "fetched"
}
```

### Current Location Access

**In dashboard pages:**
```typescript
const currentLocation = await getCurrentLocation();
const lat = currentLocation?.latitude ?? 0;
const lon = currentLocation?.longitude ?? 0;
```

**Database view automatically returns:**
- Most recent location
- Associated weather data
- Timestamp of when location was logged

## Testing

**Test Results:**
- ✅ Build: Successful
- ✅ Tests: 591 passing
- ✅ Location API: 22 tests passing
- ✅ OpenAPI: Valid spec

## Future Enhancements

Now that we have complete location history, we can add:

1. **Location Timeline**: Show travel history on a map
2. **Weather Correlations**: Analyze habits vs weather patterns
3. **Time in Locations**: Calculate time spent in different places
4. **Location-based Insights**: Productivity patterns by location
5. **Travel Statistics**: Distance traveled, countries visited over time

## Related Files

### Modified
- `app/api/location/route.ts`
- `app/api/location/route.test.ts`
- `lib/db/location.ts`
- `app/dashboard/page.tsx`
- `app/dashboard/travel/page.tsx`
- `docs/api/README.md`
- `docs/api/openapi.yaml`

### Created
- `db/migrations/011_current_location_view.sql`

### Deleted
- `app/api/location/clear/route.ts`
- `app/api/location/clear/route.test.ts`
