#!/usr/bin/env node
/**
 * Script to apply a database migration
 * Usage: node scripts/apply-migration.js <migration-file>
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.development.local' });

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node scripts/apply-migration.js <migration-file>');
  process.exit(1);
}

if (!fs.existsSync(migrationFile)) {
  console.error(`Migration file not found: ${migrationFile}`);
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL not found in environment');
  process.exit(1);
}

console.log(`Applying migration: ${migrationFile}`);

try {
  const result = execSync(`psql "${databaseUrl}" -f "${migrationFile}"`, {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log(result);
  console.log('✅ Migration applied successfully!');
} catch (error) {
  console.error('❌ Migration failed:');
  console.error(error.stdout || error.message);
  process.exit(1);
}
