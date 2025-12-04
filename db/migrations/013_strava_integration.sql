-- Migration: 013_strava_integration.sql
-- Add Strava OAuth integration and enhance workouts table for external sync

-- =====================================================
-- 1. Create strava_auth table for OAuth credentials
-- =====================================================

CREATE TABLE IF NOT EXISTS strava_auth (
  id                  serial PRIMARY KEY,
  athlete_id          bigint NOT NULL UNIQUE,
  athlete_name        varchar(255),

  -- OAuth tokens (should be encrypted in production)
  access_token        text NOT NULL,
  refresh_token       text NOT NULL,
  expires_at          timestamptz NOT NULL,
  token_type          varchar(20) DEFAULT 'Bearer',
  scopes              text[],

  -- Webhook and sync management
  webhook_subscribed  boolean DEFAULT false,
  last_sync_at        timestamptz,

  -- Metadata
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_strava_auth_athlete_id ON strava_auth(athlete_id);
CREATE INDEX idx_strava_auth_expires_at ON strava_auth(expires_at)
  WHERE expires_at < now() + interval '1 hour';

COMMENT ON TABLE strava_auth IS
  'Strava OAuth credentials per athlete for automatic activity sync';
COMMENT ON COLUMN strava_auth.athlete_id IS
  'Strava athlete ID from OAuth response';
COMMENT ON COLUMN strava_auth.access_token IS
  'Short-lived OAuth access token (6 hours)';
COMMENT ON COLUMN strava_auth.refresh_token IS
  'Long-lived refresh token for obtaining new access tokens';

-- =====================================================
-- 2. Enhance workouts table for external integrations
-- =====================================================

-- Add columns for tracking workout source and external IDs
ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS source varchar(20) DEFAULT 'manual'
    CHECK (source IN ('manual', 'strava')),
  ADD COLUMN IF NOT EXISTS external_id varchar(50),
  ADD COLUMN IF NOT EXISTS synced_at timestamptz;

-- Create unique index for external_id to prevent duplicate imports
CREATE UNIQUE INDEX IF NOT EXISTS idx_workouts_external_id
  ON workouts(external_id)
  WHERE external_id IS NOT NULL;

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_workouts_source ON workouts(source);

-- Index for finding recently synced workouts
CREATE INDEX IF NOT EXISTS idx_workouts_synced_at ON workouts(synced_at DESC)
  WHERE synced_at IS NOT NULL;

COMMENT ON COLUMN workouts.source IS
  'Origin of the workout: manual entry or strava import';
COMMENT ON COLUMN workouts.external_id IS
  'External system activity ID (e.g., Strava activity ID as string)';
COMMENT ON COLUMN workouts.synced_at IS
  'Timestamp of last sync from external system';

-- =====================================================
-- 3. Create sync log table for debugging and audit
-- =====================================================

CREATE TABLE IF NOT EXISTS strava_sync_log (
  id                serial PRIMARY KEY,
  athlete_id        bigint NOT NULL,
  activity_id       bigint NOT NULL,
  event_type        varchar(20) NOT NULL,  -- create, update, delete
  status            varchar(20) NOT NULL,  -- success, error, skipped
  error_message     text,
  synced_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fk_strava_auth
    FOREIGN KEY (athlete_id)
    REFERENCES strava_auth(athlete_id)
    ON DELETE CASCADE
);

-- Indexes for querying logs
CREATE INDEX idx_strava_sync_log_athlete ON strava_sync_log(athlete_id, synced_at DESC);
CREATE INDEX idx_strava_sync_log_activity ON strava_sync_log(activity_id);
CREATE INDEX idx_strava_sync_log_status ON strava_sync_log(status, synced_at DESC);

COMMENT ON TABLE strava_sync_log IS
  'Audit log of all Strava activity sync operations';
COMMENT ON COLUMN strava_sync_log.event_type IS
  'Type of event: create (new activity), update (modified), delete (removed)';
COMMENT ON COLUMN strava_sync_log.status IS
  'Outcome of sync operation: success, error, skipped';

-- =====================================================
-- 4. Create function to update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to strava_auth table
DROP TRIGGER IF EXISTS update_strava_auth_updated_at ON strava_auth;
CREATE TRIGGER update_strava_auth_updated_at
  BEFORE UPDATE ON strava_auth
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
