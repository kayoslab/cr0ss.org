/**
 * Migration runner for 010_correlation_engine_tables.sql
 * Adds location_history and subjective_metrics tables for correlation discovery
 */

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables
config({ path: ".env" });
config({ path: ".env.development.local" });
config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log("🚀 Running migration 010_correlation_engine_tables.sql...\n");

  try {
    // Create location_history table
    console.log("1️⃣  Creating location_history table...");
    await sql`
      CREATE TABLE IF NOT EXISTS location_history (
        id BIGSERIAL PRIMARY KEY,
        logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        latitude NUMERIC(10, 7) NOT NULL,
        longitude NUMERIC(10, 7) NOT NULL,
        temp_celsius NUMERIC(5, 2),
        feels_like_celsius NUMERIC(5, 2),
        humidity INTEGER CHECK (humidity BETWEEN 0 AND 100),
        weather_main VARCHAR(50),
        weather_description TEXT,
        wind_speed_mps NUMERIC(5, 2),
        cloudiness INTEGER CHECK (cloudiness BETWEEN 0 AND 100),
        weather_raw JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log("   ✅ location_history table created\n");

    // Create indexes for location_history
    console.log("2️⃣  Creating indexes for location_history...");
    await sql`CREATE INDEX IF NOT EXISTS idx_location_history_logged_at ON location_history(logged_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_location_history_coords ON location_history(latitude, longitude)`;
    console.log("   ✅ Indexes created\n");

    // Create subjective_metrics table
    console.log("3️⃣  Creating subjective_metrics table...");
    await sql`
      CREATE TABLE IF NOT EXISTS subjective_metrics (
        id BIGSERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        mood INTEGER CHECK (mood BETWEEN 1 AND 10),
        energy INTEGER CHECK (energy BETWEEN 1 AND 10),
        stress INTEGER CHECK (stress BETWEEN 1 AND 10),
        focus_quality INTEGER CHECK (focus_quality BETWEEN 1 AND 10),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log("   ✅ subjective_metrics table created\n");

    // Create index for subjective_metrics
    console.log("4️⃣  Creating index for subjective_metrics...");
    await sql`CREATE INDEX IF NOT EXISTS idx_subjective_metrics_date ON subjective_metrics(date DESC)`;
    console.log("   ✅ Index created\n");

    // Create trigger function
    console.log("5️⃣  Creating trigger function...");
    await sql`
      CREATE OR REPLACE FUNCTION update_subjective_metrics_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `;
    console.log("   ✅ Trigger function created\n");

    // Create trigger
    console.log("6️⃣  Creating trigger...");
    await sql`
      DROP TRIGGER IF EXISTS trigger_update_subjective_metrics_updated_at ON subjective_metrics
    `;
    await sql`
      CREATE TRIGGER trigger_update_subjective_metrics_updated_at
        BEFORE UPDATE ON subjective_metrics
        FOR EACH ROW
        EXECUTE FUNCTION update_subjective_metrics_updated_at()
    `;
    console.log("   ✅ Trigger created\n");

    console.log("✅ Migration completed successfully!\n");

    // Verify the tables were created
    console.log("📊 Verifying table creation...\n");

    const locationHistoryCheck = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'location_history'
      ORDER BY ordinal_position;
    `;

    console.log("location_history table columns:");
    console.table(locationHistoryCheck);

    const subjectiveMetricsCheck = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'subjective_metrics'
      ORDER BY ordinal_position;
    `;

    console.log("\nsubjective_metrics table columns:");
    console.table(subjectiveMetricsCheck);

    // Check indexes
    const indexCheck = await sql`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE tablename IN ('location_history', 'subjective_metrics')
      ORDER BY tablename, indexname;
    `;

    console.log("\nCreated indexes:");
    console.table(indexCheck);

    console.log("\n✨ Migration verified successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
