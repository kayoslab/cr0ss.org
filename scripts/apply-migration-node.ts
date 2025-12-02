#!/usr/bin/env tsx
/**
 * Script to apply a database migration using Node.js postgres client
 * Usage: npx tsx scripts/apply-migration-node.ts <migration-file>
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.development.local
config({ path: '.env.development.local' });

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: npx tsx scripts/apply-migration-node.ts <migration-file>');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL not found in environment');
  process.exit(1);
}

const migrationPath = resolve(migrationFile);
console.log(`📄 Reading migration: ${migrationPath}`);

let sql: string;
try {
  sql = readFileSync(migrationPath, 'utf8');
} catch (error) {
  console.error(`❌ Failed to read migration file: ${error}`);
  process.exit(1);
}

async function runMigration() {
  console.log(`🔌 Connecting to database...`);
  const db = neon(databaseUrl!);

  console.log(`🚀 Applying migration...`);

  try {
    // Split SQL into individual statements (removing comments and empty lines)
    const statements = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`   Found ${statements.length} statement(s) to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`   Executing statement ${i + 1}/${statements.length}...`);
      await db.query(statement);
    }

    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error);
    process.exit(1);
  }
}

runMigration();
