-- Migration: 014_visited_countries.sql
-- Add visited_countries table and country_code to location_history

-- =====================================================
-- 1. Create visited_countries table
-- =====================================================

CREATE TABLE visited_countries (
  id            SERIAL PRIMARY KEY,
  country_code  CHAR(2) NOT NULL UNIQUE,  -- ISO 3166-1 alpha-2 (e.g., "DE", "US")
  first_visited DATE NOT NULL,
  last_visited  DATE NOT NULL,
  visit_count   INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_visited_countries_code ON visited_countries(country_code);
CREATE INDEX idx_visited_countries_last_visited ON visited_countries(last_visited DESC);

COMMENT ON TABLE visited_countries IS
  'Tracks countries visited based on location history';
COMMENT ON COLUMN visited_countries.country_code IS
  'ISO 3166-1 alpha-2 country code (e.g., DE for Germany)';
COMMENT ON COLUMN visited_countries.first_visited IS
  'Date of first recorded visit to this country';
COMMENT ON COLUMN visited_countries.last_visited IS
  'Date of most recent recorded visit to this country';
COMMENT ON COLUMN visited_countries.visit_count IS
  'Number of times location was logged in this country';

-- =====================================================
-- 2. Add country_code to location_history
-- =====================================================

ALTER TABLE location_history
  ADD COLUMN country_code CHAR(2);

CREATE INDEX idx_location_history_country ON location_history(country_code)
  WHERE country_code IS NOT NULL;

COMMENT ON COLUMN location_history.country_code IS
  'ISO 3166-1 alpha-2 country code from weather API response';

-- =====================================================
-- 3. Create updated_at trigger function (if not exists)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. Apply updated_at trigger to visited_countries
-- =====================================================

DROP TRIGGER IF EXISTS update_visited_countries_updated_at ON visited_countries;
CREATE TRIGGER update_visited_countries_updated_at
  BEFORE UPDATE ON visited_countries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
