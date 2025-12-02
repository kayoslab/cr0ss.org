--- Migration 011: Current Location View
--- Creates a view that returns the most recent location from location_history
--- This replaces the need for storing current location separately or in KV

-- Drop view if it exists (for idempotency)
DROP VIEW IF EXISTS current_location;

-- Create view that returns the most recent location entry
CREATE VIEW current_location AS
SELECT
  id,
  logged_at,
  latitude,
  longitude,
  temp_celsius,
  feels_like_celsius,
  humidity,
  weather_main,
  weather_description,
  wind_speed_mps,
  cloudiness,
  weather_raw,
  created_at
FROM location_history
ORDER BY logged_at DESC
LIMIT 1;

-- Add comment explaining the view's purpose
COMMENT ON VIEW current_location IS 'Returns the most recent location entry from location_history. Used for displaying current location on maps and dashboards.';
