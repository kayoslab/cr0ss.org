-- Add body composition tracking to body_profile
-- This migration transforms body_profile from a single-row table to a historical tracking table

-- Step 1: Rename the old table
ALTER TABLE body_profile RENAME TO body_profile_legacy;

-- Step 2: Create new body_profile table with historical tracking
CREATE TABLE body_profile (
  id                   serial PRIMARY KEY,
  measured_at          timestamptz  NOT NULL DEFAULT now(),

  -- Core metrics
  weight_kg            numeric(6,2) NOT NULL CHECK (weight_kg > 0),
  height_cm            integer      NULL CHECK (height_cm > 0),

  -- Body composition (NEW)
  body_fat_percentage  numeric(5,2) NULL CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
  muscle_percentage    numeric(5,2) NULL CHECK (muscle_percentage >= 0 AND muscle_percentage <= 100),

  -- Caffeine metabolism parameters
  vd_l_per_kg          numeric(4,3) NULL CHECK (vd_l_per_kg > 0),   -- ~0.6 L/kg default
  half_life_hours      numeric(4,2) NULL CHECK (half_life_hours > 0),
  caffeine_sensitivity numeric(4,2) NULL CHECK (caffeine_sensitivity > 0), -- multiplier 0.5..2
  bioavailability      numeric(4,3) NULL CHECK (bioavailability > 0 AND bioavailability <= 1),

  -- Optional demographic factors (for future use)
  age                  integer      NULL CHECK (age > 0 AND age < 150),
  sex                  varchar(10)  NULL CHECK (sex IN ('male', 'female', 'other')),

  -- Notes for this measurement
  notes                text         NULL,

  created_at           timestamptz  NOT NULL DEFAULT now()
);

-- Step 3: Migrate data from legacy table
INSERT INTO body_profile (
  measured_at,
  weight_kg,
  height_cm,
  vd_l_per_kg,
  half_life_hours,
  caffeine_sensitivity,
  bioavailability,
  created_at
)
SELECT
  updated_at as measured_at,
  weight_kg,
  height_cm,
  vd_l_per_kg,
  half_life_hours,
  caffeine_sensitivity,
  bioavailability,
  updated_at as created_at
FROM body_profile_legacy
WHERE id = 1;

-- Step 4: Create index for efficient lookups
CREATE INDEX idx_body_profile_measured_at ON body_profile(measured_at DESC);

-- Step 5: Drop legacy table
DROP TABLE body_profile_legacy;

-- Step 6: Create view for "current" profile (most recent measurement)
CREATE OR REPLACE VIEW current_body_profile AS
SELECT * FROM body_profile
ORDER BY measured_at DESC
LIMIT 1;

COMMENT ON TABLE body_profile IS 'Historical body composition and caffeine metabolism tracking';
COMMENT ON COLUMN body_profile.body_fat_percentage IS 'Body fat percentage (0-100)';
COMMENT ON COLUMN body_profile.muscle_percentage IS 'Muscle mass percentage (0-100)';
COMMENT ON COLUMN body_profile.vd_l_per_kg IS 'Volume of distribution per kg lean body mass';
COMMENT ON COLUMN body_profile.half_life_hours IS 'Caffeine half-life in hours (typically 4-6)';
COMMENT ON COLUMN body_profile.caffeine_sensitivity IS 'Personal sensitivity multiplier (0.5-2.0, default 1.0)';
COMMENT ON COLUMN body_profile.bioavailability IS 'Caffeine bioavailability (0-1, typically ~0.9)';
