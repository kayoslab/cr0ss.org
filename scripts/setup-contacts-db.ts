/**
 * Setup script for the networking contact-memory store (Neon + pgvector).
 *
 * - Drops the retired `chat_embeddings` table from the old public RAG chat.
 * - Creates `contacts` (capture seeds) and `contact_embeddings` (vectors + profile).
 *
 * Run with: pnpm ai:setup
 * Requires DATABASE_URL in your environment or a .env file.
 */

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

// Load environment variables from .env files (last loaded wins).
config({ path: ".env" });
config({ path: ".env.development.local" });
config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set\n");
  console.error("Set DATABASE_URL in .env.local, .env, or your environment, e.g.:");
  console.error('  DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"\n');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("🚀 Setting up the contact-memory store...\n");

  try {
    // 1. pgvector must be available
    console.log("1️⃣  Checking for pgvector extension...");
    const [extCheck] = await sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'vector'
      ) as available
    `;
    if (!(extCheck as { available: boolean }).available) {
      console.error("❌ pgvector is not available in your Neon database. Check your plan.");
      process.exit(1);
    }
    await sql`CREATE EXTENSION IF NOT EXISTS vector`;
    console.log("✅ pgvector extension enabled\n");

    // 2. Retire the old public-chat table
    console.log("2️⃣  Dropping retired chat_embeddings table (if present)...");
    await sql`DROP TABLE IF EXISTS chat_embeddings CASCADE`;
    console.log("✅ chat_embeddings removed\n");

    // 3. contacts — capture seeds
    console.log("3️⃣  Creating contacts table...");
    await sql`
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        anchor_type TEXT NOT NULL CHECK (anchor_type IN ('linkedin', 'company')),
        anchor_value TEXT NOT NULL,
        message TEXT,
        source TEXT NOT NULL DEFAULT 'portfolio',
        campaign_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'enriching', 'enriched', 'failed')),
        apify_run_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        enriched_at TIMESTAMP WITH TIME ZONE
      )
    `;
    // Idempotent: add campaign_id to an existing contacts table if missing.
    await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS campaign_id TEXT`;
    await sql`CREATE INDEX IF NOT EXISTS contacts_status_idx ON contacts (status)`;
    await sql`CREATE INDEX IF NOT EXISTS contacts_campaign_id_idx ON contacts (campaign_id)`;
    await sql`CREATE INDEX IF NOT EXISTS contacts_created_at_idx ON contacts (created_at)`;
    console.log("✅ contacts table ready\n");

    // 4. contact_embeddings — vectors + enriched profile
    console.log("4️⃣  Creating contact_embeddings table...");
    await sql`
      CREATE TABLE IF NOT EXISTS contact_embeddings (
        id SERIAL PRIMARY KEY,
        contact_id UUID NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        embedding vector(384),
        profile JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS contact_embeddings_contact_id_idx
        ON contact_embeddings (contact_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS contact_embeddings_profile_idx
        ON contact_embeddings USING gin (profile)
    `;
    // No approximate vector index (ivfflat/hnsw) on purpose. A personal contact
    // store is small, so an exact sequential scan is fast and always correct.
    // An ivfflat index with lists=100 + default probes=1 silently returns zero
    // rows on a tiny table (it only scans one of 100 clusters). Add HNSW only if
    // this ever grows into the tens of thousands of contacts.
    await sql`DROP INDEX IF EXISTS contact_embeddings_embedding_idx`;
    console.log("✅ contact_embeddings table + indexes ready\n");

    // 5. Verify
    console.log("5️⃣  Verifying tables...");
    const tables = (await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('contacts', 'contact_embeddings')
      ORDER BY table_name
    `) as Array<{ table_name: string }>;
    const found = tables.map((t) => t.table_name);
    if (!found.includes("contacts") || !found.includes("contact_embeddings")) {
      throw new Error(`Expected both tables, found: ${found.join(", ") || "none"}`);
    }
    console.log(`✅ Tables present: ${found.join(", ")}\n`);

    console.log("🎉 Setup complete. The contact-memory store is ready.\n");
  } catch (error) {
    console.error("\n❌ Setup failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
