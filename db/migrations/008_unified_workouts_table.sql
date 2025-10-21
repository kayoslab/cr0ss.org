-- Unified workouts table for all activity types
-- Migrates existing runs data and adds support for climbing, bouldering, rowing, cycling, etc.

-- Step 1: Create new workouts table
CREATE TABLE workouts (
  id                serial PRIMARY KEY,
  date              date NOT NULL,
  workout_type      varchar(20) NOT NULL CHECK (workout_type IN (
    'running',
    'climbing',
    'bouldering',
    'rowing',
    'cycling',
    'hiking',
    'strength',
    'other'
  )),
  duration_min      integer NOT NULL CHECK (duration_min > 0),

  -- Universal metrics (applicable to multiple activity types)
  distance_km       numeric(6,2) CHECK (distance_km > 0),           -- running, cycling, rowing, hiking
  elevation_gain_m  integer CHECK (elevation_gain_m >= 0),          -- running, climbing, cycling, hiking

  -- Intensity and effort
  intensity         varchar(10) CHECK (intensity IN ('low', 'moderate', 'high', 'max')),
  perceived_effort  integer CHECK (perceived_effort >= 1 AND perceived_effort <= 10), -- RPE scale

  -- Activity-specific metrics (flexible JSON storage)
  details           jsonb,

  -- Optional notes
  notes             text,

  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Step 2: Create indexes for efficient queries
CREATE INDEX idx_workouts_date ON workouts(date DESC);
CREATE INDEX idx_workouts_type ON workouts(workout_type);
CREATE INDEX idx_workouts_date_type ON workouts(date DESC, workout_type);

-- Step 3: Migrate data from runs table
INSERT INTO workouts (
  date,
  workout_type,
  duration_min,
  distance_km,
  intensity,
  details,
  created_at
)
SELECT
  date,
  'running' as workout_type,
  duration_min,
  distance_km,
  CASE
    WHEN avg_pace_sec_per_km < 240 THEN 'max'        -- < 4:00/km pace
    WHEN avg_pace_sec_per_km < 300 THEN 'high'       -- 4:00-5:00/km pace
    WHEN avg_pace_sec_per_km < 360 THEN 'moderate'   -- 5:00-6:00/km pace
    ELSE 'low'                                        -- > 6:00/km pace
  END as intensity,
  jsonb_build_object(
    'avg_pace_sec_per_km', avg_pace_sec_per_km,
    'migrated_from_runs', true
  ) as details,
  now() as created_at
FROM runs
ORDER BY date;

-- Step 4: Drop the old runs table
DROP TABLE runs;

-- Step 5: Add helpful comments
COMMENT ON TABLE workouts IS 'Unified table for all workout/activity types with flexible schema';
COMMENT ON COLUMN workouts.workout_type IS 'Type of workout: running, climbing, bouldering, rowing, cycling, hiking, strength, other';
COMMENT ON COLUMN workouts.intensity IS 'Subjective intensity level: low, moderate, high, max';
COMMENT ON COLUMN workouts.perceived_effort IS 'Rate of Perceived Exertion (RPE) on 1-10 scale';
COMMENT ON COLUMN workouts.details IS 'Activity-specific metrics in JSON format. Examples:
  Running: {"avg_pace_sec_per_km": 300, "heart_rate_avg": 150}
  Climbing: {"grade": "6b+", "pitches": 5, "style": "outdoor", "location": "Frankenjura"}
  Bouldering: {"problems": 15, "max_grade": "V5", "indoor": true, "gym": "Boulderwelt"}
  Rowing: {"distance_m": 5000, "avg_pace_per_500m": 120, "watts": 200}
  Cycling: {"avg_speed_kmh": 25, "max_heart_rate": 175, "route": "..."}';

-- Step 6: Create view for backward compatibility (if needed for existing queries)
CREATE OR REPLACE VIEW runs_legacy AS
SELECT
  id,
  date,
  duration_min,
  distance_km,
  (details->>'avg_pace_sec_per_km')::integer as avg_pace_sec_per_km,
  created_at
FROM workouts
WHERE workout_type = 'running'
  AND details ? 'avg_pace_sec_per_km';

COMMENT ON VIEW runs_legacy IS 'Backward compatibility view for old runs table queries. Use workouts table directly for new code.';
