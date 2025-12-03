#!/usr/bin/env tsx
/**
 * Script to apply goal_period migration
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables from .env.development.local
config({ path: '.env.development.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL not found in environment');
  process.exit(1);
}

async function runMigration() {
  console.log(`🔌 Connecting to database...`);
  const db = neon(databaseUrl!);

  console.log(`🚀 Applying goal_period migration...`);

  try {
    // 1. Create goal_period enum
    console.log('   Creating goal_period enum...');
    await db`
      DO $$ BEGIN
        CREATE TYPE goal_period AS ENUM ('monthly', 'daily');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // 2. Add period column (nullable initially)
    console.log('   Adding period column...');
    await db`
      ALTER TABLE monthly_goals
        ADD COLUMN IF NOT EXISTS period goal_period;
    `;

    // 3. Backfill existing goals
    console.log('   Backfilling existing goals...');
    await db`
      UPDATE monthly_goals
      SET period = CASE
        WHEN kind = 'running_distance_km' THEN 'monthly'::goal_period
        WHEN kind IN ('steps', 'reading_minutes', 'outdoor_minutes', 'writing_minutes', 'coding_minutes', 'focus_minutes') THEN 'daily'::goal_period
        ELSE 'daily'::goal_period
      END
      WHERE period IS NULL;
    `;

    // 4. Make period NOT NULL
    console.log('   Making period NOT NULL...');
    await db`
      ALTER TABLE monthly_goals
        ALTER COLUMN period SET NOT NULL;
    `;

    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error);
    process.exit(1);
  }
}

runMigration();
