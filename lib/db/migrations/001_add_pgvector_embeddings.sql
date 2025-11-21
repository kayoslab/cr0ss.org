-- Migration: Add pgvector extension and create embeddings table for AI chat
-- Run with: psql $DATABASE_URL -f lib/db/migrations/001_add_pgvector_embeddings.sql

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create chat_embeddings table
CREATE TABLE IF NOT EXISTS chat_embeddings (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(384),  -- all-MiniLM-L6-v2 dimension (Transformers.js)
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create index for fast similarity search
-- Using ivfflat index for cosine similarity
-- Note: This requires some data to be present for optimal performance
-- If table is empty, you can create the index after first indexing
CREATE INDEX IF NOT EXISTS chat_embeddings_embedding_idx
  ON chat_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 4. Create GIN index on metadata for faster filtering
CREATE INDEX IF NOT EXISTS chat_embeddings_metadata_idx
  ON chat_embeddings
  USING gin (metadata);

-- 5. Add comment for documentation
COMMENT ON TABLE chat_embeddings IS 'Vector embeddings for AI chat assistant RAG (Retrieval-Augmented Generation)';
COMMENT ON COLUMN chat_embeddings.content IS 'The actual text content that was embedded';
COMMENT ON COLUMN chat_embeddings.embedding IS 'Vector embedding from all-MiniLM-L6-v2 via Transformers.js (384 dimensions)';
COMMENT ON COLUMN chat_embeddings.metadata IS 'JSON metadata: { source: "blog"|"knowledge", slug?: string, title?: string, file?: string }';
