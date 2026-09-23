-- Contact-memory store for the portfolio capture flow (NFC card → WhatsApp).
-- Replaces the retired public-chat `chat_embeddings` table from the old RAG
-- assistant; the schema below was previously created by scripts/setup-contacts-db.ts.

CREATE EXTENSION IF NOT EXISTS vector;

DROP TABLE IF EXISTS chat_embeddings CASCADE;

-- Capture seeds: what the visitor typed on the portfolio page.
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
);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS campaign_id TEXT;
CREATE INDEX IF NOT EXISTS contacts_status_idx ON contacts (status);
CREATE INDEX IF NOT EXISTS contacts_campaign_id_idx ON contacts (campaign_id);
CREATE INDEX IF NOT EXISTS contacts_created_at_idx ON contacts (created_at);

-- Enriched profile + 384-dimensional embedding (see lib/ai/embeddings.ts).
CREATE TABLE IF NOT EXISTS contact_embeddings (
  id SERIAL PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(384),
  profile JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS contact_embeddings_contact_id_idx
  ON contact_embeddings (contact_id);
CREATE INDEX IF NOT EXISTS contact_embeddings_profile_idx
  ON contact_embeddings USING gin (profile);

-- No approximate vector index (ivfflat/hnsw) on purpose. A personal contact
-- store is small, so an exact sequential scan is fast and always correct. An
-- ivfflat index with lists=100 and the default probes=1 silently returns zero
-- rows on a tiny table. Add HNSW only if this grows to tens of thousands of rows.
DROP INDEX IF EXISTS contact_embeddings_embedding_idx;
