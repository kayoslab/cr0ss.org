/**
 * Update existing chat_embeddings table to use 384 dimensions
 * Run with: pnpm tsx scripts/update-embedding-dimension.ts
 */

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

// Load environment variables
config({ path: ".env" });
config({ path: ".env.development.local" });
config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("🔄 Updating chat_embeddings table to 384 dimensions...\n");

  try {
    // Drop and recreate the embedding column
    await sql`ALTER TABLE chat_embeddings DROP COLUMN IF EXISTS embedding`;
    console.log("✅ Dropped old embedding column");

    await sql`ALTER TABLE chat_embeddings ADD COLUMN embedding vector(384)`;
    console.log("✅ Added new embedding column (384 dimensions)");

    // Drop and recreate index
    await sql`DROP INDEX IF EXISTS chat_embeddings_embedding_idx`;
    console.log("✅ Dropped old index");

    try {
      await sql`
        CREATE INDEX chat_embeddings_embedding_idx
          ON chat_embeddings
          USING ivfflat (embedding vector_cosine_ops)
          WITH (lists = 100)
      `;
      console.log("✅ Created new index");
    } catch (error) {
      console.log("⚠️  Index will be created after first data is added");
    }

    console.log("\n🎉 Migration complete! Ready for 384-dimension embeddings.");
    console.log("   Next: Run `pnpm ai:index` to populate with new embeddings\n");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
