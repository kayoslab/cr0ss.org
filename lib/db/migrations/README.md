# Database Migrations

This directory contains SQL migration files for the Neon PostgreSQL database.

## Available Migrations

### 001_add_pgvector_embeddings.sql

Adds pgvector extension and creates the `chat_embeddings` table for AI chat functionality.

**What it does:**
- Enables the `vector` extension (pgvector)
- Creates `chat_embeddings` table with:
  - `id` - Auto-incrementing primary key
  - `content` - The actual text content
  - `embedding` - Vector embedding (1536 dimensions for OpenAI)
  - `metadata` - JSONB for source tracking
  - `created_at`, `updated_at` - Timestamps
- Creates vector similarity search index (ivfflat)
- Creates metadata index (GIN) for filtering

## Running Migrations

### Option 1: Using the setup script (Recommended)

```bash
pnpm ai:setup
```

This will:
- Check if pgvector is available
- Run the migration
- Verify the setup
- Show current stats

### Option 2: Manual via psql

```bash
psql $DATABASE_URL -f lib/db/migrations/001_add_pgvector_embeddings.sql
```

### Option 3: Using Neon Console

1. Go to your Neon dashboard
2. Select your database
3. Open SQL Editor
4. Copy and paste the migration file contents
5. Execute

## Verifying Installation

After running the migration, verify with:

```sql
-- Check if pgvector extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if table exists
\d chat_embeddings

-- Check current embeddings count
SELECT
  count(*) as total,
  count(*) FILTER (WHERE metadata->>'source' = 'blog') as blog_posts,
  count(*) FILTER (WHERE metadata->>'source' = 'knowledge') as knowledge_base
FROM chat_embeddings;
```

## About pgvector

pgvector is a PostgreSQL extension for vector similarity search. It allows storing vector embeddings and performing fast similarity searches using cosine distance, L2 distance, or inner product.

**Requirements:**
- PostgreSQL 11+
- pgvector extension must be available in your Neon plan

**Note:** Neon provides pgvector on most plans. If you encounter issues, check your plan or contact Neon support.

## Index Performance

The ivfflat index is optimized for:
- Fast approximate nearest neighbor search
- Cosine similarity (used for text embeddings)
- Large datasets (100k+ vectors)

For small datasets (<10k vectors), a sequential scan might be faster than the index.

## Metadata Schema

The `metadata` JSONB column follows this schema:

```typescript
{
  source: "blog" | "knowledge",  // Required
  slug?: string,                 // For blog posts
  title?: string,                // For blog posts
  file?: string,                 // For knowledge base files
  url?: string                   // Full URL if applicable
}
```

## Maintenance

### Re-indexing

To completely re-index all content:

```sql
-- Clear all embeddings
TRUNCATE chat_embeddings;

-- Then run the indexing script (to be created in step 3)
```

### Checking Table Size

```sql
SELECT pg_size_pretty(pg_total_relation_size('chat_embeddings'));
```

### Monitoring Performance

```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'chat_embeddings';
```
