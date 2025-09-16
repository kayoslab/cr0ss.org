-- 1) Extend goal_kind enum with new kinds (idempotent adds)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='goal_kind' AND e.enumlabel='steps') THEN
    ALTER TYPE goal_kind ADD VALUE 'steps';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='goal_kind' AND e.enumlabel='reading_minutes') THEN
    ALTER TYPE goal_kind ADD VALUE 'reading_minutes';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='goal_kind' AND e.enumlabel='outdoor_minutes') THEN
    ALTER TYPE goal_kind ADD VALUE 'outdoor_minutes';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='goal_kind' AND e.enumlabel='writing_minutes') THEN
    ALTER TYPE goal_kind ADD VALUE 'writing_minutes';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='goal_kind' AND e.enumlabel='focus_minutes') THEN
    ALTER TYPE goal_kind ADD VALUE 'focus_minutes';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='goal_kind' AND e.enumlabel='coding_minutes') THEN
    ALTER TYPE goal_kind ADD VALUE 'coding_minutes';
  END IF;
END $$;

-- 2) Add new columns to days (idempotent + constrained)
ALTER TABLE days
  ADD COLUMN IF NOT EXISTS reading_minutes   integer NOT NULL DEFAULT 0 CHECK (reading_minutes   >= 0),
  ADD COLUMN IF NOT EXISTS outdoor_minutes   integer NOT NULL DEFAULT 0 CHECK (outdoor_minutes   >= 0),
  ADD COLUMN IF NOT EXISTS writing_minutes   integer NOT NULL DEFAULT 0 CHECK (writing_minutes   >= 0),
  ADD COLUMN IF NOT EXISTS coding_minutes    integer NOT NULL DEFAULT 0 CHECK (coding_minutes    >= 0),
  ADD COLUMN IF NOT EXISTS steps             integer NOT NULL DEFAULT 0 CHECK (steps             >= 0),
  ADD COLUMN IF NOT EXISTS journaled         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS extras            jsonb   NOT NULL DEFAULT '{}'::jsonb;

-- 3) Backfill data from rituals -> days (if rituals exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rituals') THEN
    UPDATE days d
    SET
      reading_minutes = COALESCE(d.reading_minutes, 0) + COALESCE(r.reading_minutes, 0),
      outdoor_minutes = COALESCE(d.outdoor_minutes, 0) + COALESCE(r.outdoor_minutes, 0),
      writing_minutes = COALESCE(d.writing_minutes, 0) + COALESCE(r.writing_minutes, 0),
      steps           = COALESCE(d.steps, 0) + COALESCE(r.steps, 0),
      journaled       = COALESCE(d.journaled, false) OR COALESCE(r.journaled, false),
      extras          = COALESCE(d.extras, '{}'::jsonb) || COALESCE(r.extras, '{}'::jsonb),
      updated_at      = now()
    FROM rituals r
    WHERE r.date = d.date;

    -- Ensure every rituals.date has a days row (if some dates didn’t exist)
    INSERT INTO days (date, reading_minutes, outdoor_minutes, writing_minutes, steps, journaled, extras, created_at, updated_at)
    SELECT
      r.date,
      COALESCE(r.reading_minutes, 0),
      COALESCE(r.outdoor_minutes, 0),
      COALESCE(r.writing_minutes, 0),
      COALESCE(r.steps, 0),
      COALESCE(r.journaled, false),
      COALESCE(r.extras, '{}'::jsonb),
      now(), now()
    FROM rituals r
    WHERE NOT EXISTS (SELECT 1 FROM days d2 WHERE d2.date = r.date);
  END IF;
END $$;

-- 4) Drop rituals table if present
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rituals') THEN
    DROP TABLE rituals;
  END IF;
END $$;
