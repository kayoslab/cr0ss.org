/**
 * Setup script for pgvector extension and chat_embeddings table
 *
 * Run with: pnpm ai:setup
 *
 * Make sure DATABASE_URL is set in your environment or .env.local file
 */

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

// Load environment variables from .env files
// Load in order of precedence (last loaded wins for new variables)
config({ path: ".env" });
config({ path: ".env.development.local" });
config({ path: ".env.local" });

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set\n");
  console.error("Please set DATABASE_URL in one of:");
  console.error("  - .env.local");
  console.error("  - .env");
  console.error("  - Environment variables\n");
  console.error("Example:");
  console.error('  DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"\n');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("🚀 Setting up pgvector for AI chat...\n");

  try {
    // 1. Check if pgvector extension exists
    console.log("1️⃣  Checking for pgvector extension...");
    const [extCheck] = await sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'vector'
      ) as available
    `;

    if (!(extCheck as { available: boolean }).available) {
      console.error("❌ pgvector extension is not available in your Neon database");
      console.error("   Please contact Neon support or check your plan");
      process.exit(1);
    }
    console.log("✅ pgvector extension is available\n");

    // 2. Execute migration statements individually
    console.log("2️⃣  Running migration...");

    // Statement 1: Enable pgvector extension
    try {
      await sql`CREATE EXTENSION IF NOT EXISTS vector`;
      console.log("   ✅ pgvector extension enabled");
    } catch (error) {
      console.error("   ⚠️  pgvector extension setup:", error instanceof Error ? error.message : String(error));
    }

    // Statement 2: Create chat_embeddings table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS chat_embeddings (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          embedding vector(384),
          metadata JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      console.log("   ✅ chat_embeddings table created (384 dimensions for Transformers.js)");
    } catch (error) {
      console.error("   ❌ Failed to create table:", error instanceof Error ? error.message : String(error));
      throw error;
    }

    // Statement 3: Create vector index (may fail if table is empty, that's OK)
    try {
      await sql`
        CREATE INDEX IF NOT EXISTS chat_embeddings_embedding_idx
          ON chat_embeddings
          USING ivfflat (embedding vector_cosine_ops)
          WITH (lists = 100)
      `;
      console.log("   ✅ Vector similarity index created");
    } catch (error) {
      console.log("   ⚠️  Vector index skipped (will be created after first data):",
        error instanceof Error ? error.message.split('\n')[0] : String(error));
    }

    // Statement 4: Create metadata index
    try {
      await sql`
        CREATE INDEX IF NOT EXISTS chat_embeddings_metadata_idx
          ON chat_embeddings
          USING gin (metadata)
      `;
      console.log("   ✅ Metadata index created");
    } catch (error) {
      console.error("   ⚠️  Metadata index:", error instanceof Error ? error.message : String(error));
    }

    console.log("✅ Migration complete\n");

    // 3. Verify table exists
    console.log("3️⃣  Verifying chat_embeddings table...");
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'chat_embeddings'
      ) as exists
    `;

    console.log("   Debug - Table check result:", JSON.stringify(tableCheck));

    const exists = tableCheck[0]?.exists;
    if (!exists) {
      // Try to list tables for debugging
      const tables = await sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      console.log("   Available tables:", tables.map(t => (t as { table_name: string }).table_name).join(", "));
      throw new Error("chat_embeddings table was not created");
    }
    console.log("✅ chat_embeddings table exists\n");

    // 4. Check pgvector extension is enabled
    console.log("4️⃣  Checking pgvector extension status...");
    const [vectorCheck] = await sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as enabled
    `;

    if (!(vectorCheck as { enabled: boolean }).enabled) {
      throw new Error("pgvector extension was not enabled");
    }
    console.log("✅ pgvector extension is enabled\n");

    // 5. Show current stats
    console.log("5️⃣  Current embeddings stats:");
    const [stats] = await sql`
      SELECT
        count(*) as total,
        count(*) FILTER (WHERE metadata->>'source' = 'blog') as blog_count,
        count(*) FILTER (WHERE metadata->>'source' = 'knowledge') as knowledge_count
      FROM chat_embeddings
    `;

    interface StatsRow {
      total: number;
      blog_count: number;
      knowledge_count: number;
    }

    const row = stats as StatsRow;
    console.log(`   Total embeddings: ${row.total}`);
    console.log(`   Blog posts: ${row.blog_count}`);
    console.log(`   Knowledge base: ${row.knowledge_count}\n`);

    console.log("🎉 Setup complete! You're ready to index content.\n");
    console.log("Next steps:");
    console.log("  1. Fill out the knowledge base files in lib/ai/knowledge-base/");
    console.log("  2. Run: pnpm ai:index (command will be created in next step)");

  } catch (error) {
    console.error("\n❌ Setup failed:", error);
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

main();
