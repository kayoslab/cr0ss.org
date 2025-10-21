-- Move activity-specific metrics (distance_km, elevation_gain_m) into the details JSONB field
-- This makes the schema cleaner and allows for workout-specific metrics without cluttering the main table

-- Step 1: Migrate existing data to details JSONB
UPDATE workouts
SET details = COALESCE(details, '{}'::jsonb)
  || jsonb_build_object(
       'distance_km', distance_km,
       'elevation_gain_m', elevation_gain_m
     )
WHERE distance_km IS NOT NULL OR elevation_gain_m IS NOT NULL;

-- Step 2: Drop the now-redundant columns
ALTER TABLE workouts DROP COLUMN distance_km;
ALTER TABLE workouts DROP COLUMN elevation_gain_m;

-- Step 3: Update the legacy runs view to extract from details
DROP VIEW IF EXISTS runs_legacy;

CREATE OR REPLACE VIEW runs_legacy AS
SELECT
  id,
  date,
  duration_min,
  (details->>'distance_km')::numeric as distance_km,
  (details->>'avg_pace_sec_per_km')::integer as avg_pace_sec_per_km,
  created_at
FROM workouts
WHERE workout_type = 'running'
  AND details ? 'distance_km';

COMMENT ON VIEW runs_legacy IS 'Backward compatibility view for old runs table queries. Use workouts table directly for new code.';

-- Step 4: Add helpful comments about common details schemas
COMMENT ON COLUMN workouts.details IS 'Activity-specific metrics in JSON format. Common schemas by type:

Running: {
  "distance_km": 10.5,
  "elevation_gain_m": 150,
  "avg_pace_sec_per_km": 300,
  "avg_heart_rate": 150,
  "max_heart_rate": 175
}

Climbing: {
  "grade": "6b+",
  "pitches": 5,
  "style": "lead" | "top_rope" | "multi_pitch",
  "location": "Frankenjura",
  "route_name": "...",
  "indoor": false
}

Bouldering: {
  "problems": 15,
  "max_grade": "V5",
  "sends": 8,
  "attempts": 25,
  "indoor": true,
  "gym": "Boulderwelt München"
}

Rowing: {
  "distance_m": 5000,
  "strokes": 1250,
  "avg_pace_per_500m": 120,
  "avg_power_watts": 200,
  "avg_heart_rate": 160
}

Cycling: {
  "distance_km": 50,
  "elevation_gain_m": 800,
  "avg_speed_kmh": 25,
  "max_speed_kmh": 55,
  "avg_heart_rate": 145,
  "route": "..."
}

Hiking: {
  "distance_km": 15,
  "elevation_gain_m": 1200,
  "elevation_loss_m": 1200,
  "trail_name": "...",
  "location": "Bavarian Alps"
}

Strength: {
  "exercises": [
    {"name": "Squat", "sets": 3, "reps": 8, "weight_kg": 100},
    {"name": "Bench Press", "sets": 3, "reps": 10, "weight_kg": 80}
  ],
  "muscle_groups": ["legs", "chest"]
}';
