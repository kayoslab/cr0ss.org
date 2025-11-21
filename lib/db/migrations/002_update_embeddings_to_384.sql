-- Migration: Update chat_embeddings from 1536 to 384 dimensions
-- This migration updates the vector dimension for the new embedding model
-- Run with: psql $DATABASE_URL -f lib/db/migrations/002_update_embeddings_to_384.sql

-- 1. Drop existing data (since we're changing dimensions)
TRUNCATE TABLE chat_embeddings;

-- 2. Drop the old vector column
ALTER TABLE chat_embeddings DROP COLUMN IF EXISTS embedding;

-- 3. Add new vector column with 384 dimensions
ALTER TABLE chat_embeddings ADD COLUMN embedding vector(384);

-- 4. Drop old index if exists
DROP INDEX IF EXISTS chat_embeddings_embedding_idx;

-- 5. Recreate index (will be populated after indexing)
-- Note: This may fail if table is empty, which is fine
CREATE INDEX IF NOT EXISTS chat_embeddings_embedding_idx
  ON chat_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 6. Update comment
COMMENT ON COLUMN chat_embeddings.embedding IS 'Vector embedding from all-MiniLM-L6-v2 via Transformers.js (384 dimensions)';
