-- 1) Add the Contentful link column
ALTER TABLE coffee_log
  ADD COLUMN IF NOT EXISTS coffee_cf_id text; -- Contentful Entry ID (11 chars), keep text for flexibility

-- 2) Light index for typical donuts/filters
CREATE INDEX IF NOT EXISTS idx_coffee_log_date_cf
  ON coffee_log (date, coffee_cf_id);

-- 3) Archive legacy columns before dropping
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'coffee_log_legacy'
  ) THEN
    CREATE TABLE coffee_log_legacy AS
    SELECT id, date, time, type, caffeine_mg, tasting, notes
    FROM coffee_log
    WHERE caffeine_mg IS NOT NULL OR tasting IS NOT NULL OR notes IS NOT NULL;
  END IF;
END $$;

-- 4) Drop legacy columns from the active table (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='coffee_log' AND column_name='caffeine_mg') THEN
    ALTER TABLE coffee_log DROP COLUMN caffeine_mg;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='coffee_log' AND column_name='tasting') THEN
    ALTER TABLE coffee_log DROP COLUMN tasting;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='coffee_log' AND column_name='notes') THEN
    ALTER TABLE coffee_log DROP COLUMN notes;
  END IF;
END $$;
