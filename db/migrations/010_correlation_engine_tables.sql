-- Migration 010: Correlation Engine Tables
-- Creates location_history and subjective_metrics tables for correlation discovery

-- Location History with Weather Data
-- Stores historical location data along with weather conditions from OpenWeatherMap
CREATE TABLE IF NOT EXISTS location_history (
  id BIGSERIAL PRIMARY KEY,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,

  -- Weather data from OpenWeatherMap
  temp_celsius NUMERIC(5, 2),
  feels_like_celsius NUMERIC(5, 2),
  humidity INTEGER CHECK (humidity BETWEEN 0 AND 100),
  weather_main VARCHAR(50),         -- e.g., "Clear", "Rain", "Clouds"
  weather_description TEXT,          -- e.g., "clear sky", "light rain"
  wind_speed_mps NUMERIC(5, 2),     -- meters per second
  cloudiness INTEGER CHECK (cloudiness BETWEEN 0 AND 100),
  weather_raw JSONB,                 -- Full OpenWeatherMap response for future analysis

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient time-based queries
CREATE INDEX idx_location_history_logged_at ON location_history(logged_at DESC);

-- Index for geospatial queries (if needed in future)
CREATE INDEX idx_location_history_coords ON location_history(latitude, longitude);

-- Subjective Metrics
-- User-reported daily metrics for mood, energy, stress, focus quality
CREATE TABLE IF NOT EXISTS subjective_metrics (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,  -- One entry per day

  -- All metrics on a 1-10 scale
  mood INTEGER CHECK (mood BETWEEN 1 AND 10),
  energy INTEGER CHECK (energy BETWEEN 1 AND 10),
  stress INTEGER CHECK (stress BETWEEN 1 AND 10),
  focus_quality INTEGER CHECK (focus_quality BETWEEN 1 AND 10),

  -- Optional notes field for context
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient date-based queries
CREATE INDEX idx_subjective_metrics_date ON subjective_metrics(date DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subjective_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subjective_metrics_updated_at
  BEFORE UPDATE ON subjective_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_subjective_metrics_updated_at();

-- Comments for documentation
COMMENT ON TABLE location_history IS 'Historical location data with weather conditions from OpenWeatherMap API';
COMMENT ON TABLE subjective_metrics IS 'User-reported daily subjective metrics (mood, energy, stress, focus) on 1-10 scale';
COMMENT ON COLUMN location_history.weather_raw IS 'Full JSON response from OpenWeatherMap API for future extensibility';
COMMENT ON COLUMN subjective_metrics.date IS 'Unique constraint ensures one entry per day';
