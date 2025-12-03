-- Add goal_period to distinguish between monthly and daily goals
-- monthly: goals tracked across the month (e.g., running_distance_km)
-- daily: goals tracked per day (e.g., steps, reading_minutes, etc.)

-- 1) Create goal_period enum
DO $$ BEGIN
  CREATE TYPE goal_period AS ENUM ('monthly', 'daily');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2) Add goal_period column (nullable initially for migration)
ALTER TABLE monthly_goals
  ADD COLUMN IF NOT EXISTS period goal_period;

-- 3) Backfill existing goals based on their kind
UPDATE monthly_goals
SET period = CASE
  WHEN kind = 'running_distance_km' THEN 'monthly'::goal_period
  WHEN kind IN ('steps', 'reading_minutes', 'outdoor_minutes', 'writing_minutes', 'coding_minutes', 'focus_minutes') THEN 'daily'::goal_period
  ELSE 'daily'::goal_period -- default to daily for any new kinds
END
WHERE period IS NULL;

-- 4) Make period NOT NULL now that we've backfilled
ALTER TABLE monthly_goals
  ALTER COLUMN period SET NOT NULL;

-- 5) Update the unique constraint to include period
-- Drop old constraint first
ALTER TABLE monthly_goals
  DROP CONSTRAINT IF EXISTS monthly_goals_month_kind_key;

-- Add new constraint with period
ALTER TABLE monthly_goals
  ADD CONSTRAINT monthly_goals_month_kind_key UNIQUE (month, kind);

-- Note: We keep the existing unique constraint on (month, kind) since each goal kind
-- should only have one period type. The period column is for filtering/querying.
