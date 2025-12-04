#!/usr/bin/env tsx
/**
 * Script to apply Strava integration migration
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

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

  console.log(`📄 Reading migration file...`);
  const migrationPath = join(process.cwd(), 'db/migrations/013_strava_integration.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log(`🚀 Applying Strava integration migration...`);

  try {
    // Split the migration into individual statements
    // Remove comments and split by semicolons
    const statements = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      if (statement) {
        await db.unsafe(statement);
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('Created tables:');
    console.log('  - strava_auth (OAuth credentials)');
    console.log('  - strava_sync_log (audit log)');
    console.log('');
    console.log('Enhanced tables:');
    console.log('  - workouts (added source, external_id, synced_at columns)');

  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error);
    process.exit(1);
  }
}

runMigration();
