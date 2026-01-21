#!/usr/bin/env tsx
/**
 * Script to apply the visited countries migration
 *
 * Usage: npx tsx scripts/apply-visited-countries-migration.ts
 */

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables
config({ path: ".env.development.local" });
config({ path: ".env.local" });
config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL not found in environment");
  process.exit(1);
}

async function runMigration() {
  console.log(`🔌 Connecting to database...`);
  const db = neon(databaseUrl!);

  console.log(`📄 Reading migration file...`);
  const migrationPath = join(
    process.cwd(),
    "db/migrations/014_visited_countries.sql"
  );
  const migrationSQL = readFileSync(migrationPath, "utf-8");

  console.log(`🚀 Applying visited countries migration...`);

  try {
    // Remove SQL comments and normalize whitespace
    const cleanSQL = migrationSQL
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith("--");
      })
      .join("\n");

    // Split on semicolon but be careful with function bodies
    const statements = cleanSQL
      .split(/;(?=\s*(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|COMMENT|$))/i)
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    console.log(`Found ${statements.length} statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      // Get first line for logging (max 80 chars)
      const preview = statement.split("\n")[0].substring(0, 80);
      console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);

      try {
        await db.unsafe(statement);
        console.log(`  ✓ Success`);
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string };
        // Check if error is about object already existing
        if (err.code === "42P07" || err.code === "42710") {
          console.log(`  ⚠ Already exists, skipping`);
        } else {
          console.error(`  ✗ Failed:`, err.message);
          throw error;
        }
      }
    }

    console.log("\n✅ Migration applied successfully!");
    console.log("");
    console.log("Created tables:");
    console.log("  - visited_countries (country visit tracking)");
    console.log("");
    console.log("Enhanced tables:");
    console.log("  - location_history (added country_code column)");
  } catch (error) {
    console.error("\n❌ Migration failed:");
    console.error(error);
    process.exit(1);
  }
}

runMigration();
