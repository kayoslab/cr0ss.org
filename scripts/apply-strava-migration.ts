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
    // Remove SQL comments and normalize whitespace
    const cleanSQL = migrationSQL
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('--');
      })
      .join('\n');

    // Split on semicolon but be careful with function bodies
    const statements = cleanSQL
      .split(/;(?=\s*(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|COMMENT|$))/i)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Found ${statements.length} statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      // Get first line for logging (max 80 chars)
      const preview = statement.split('\n')[0].substring(0, 80);
      console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);

      try {
        await db.unsafe(statement);
        console.log(`  ✓ Success`);
      } catch (error: any) {
        // Check if error is about object already existing
        if (error.code === '42P07' || error.code === '42710') {
          console.log(`  ⚠ Already exists, skipping`);
        } else {
          console.error(`  ✗ Failed:`, error.message);
          throw error;
        }
      }
    }

    console.log('\n✅ Migration applied successfully!');
    console.log('');
    console.log('Created tables:');
    console.log('  - strava_auth (OAuth credentials)');
    console.log('  - strava_sync_log (audit log)');
    console.log('');
    console.log('Enhanced tables:');
    console.log('  - workouts (added source, external_id, synced_at columns)');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  }
}

runMigration();
