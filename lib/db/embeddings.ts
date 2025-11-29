import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import { ZRetrievalResult, type EmbeddingMetadata, type RetrievalResult } from "./models";

// Lazy-load SQL connection to allow environment variables to be set first
let sql: ReturnType<typeof neon> | null = null;
function getSQL() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

/**
 * Store a new embedding in the database
 */
export async function insertEmbedding(
  content: string,
  embedding: number[],
  metadata: EmbeddingMetadata
): Promise<number> {
  const sql = getSQL();
  const results = await sql`
    INSERT INTO chat_embeddings (content, embedding, metadata)
    VALUES (
      ${content},
      ${JSON.stringify(embedding)}::vector,
      ${JSON.stringify(metadata)}::jsonb
    )
    RETURNING id
  ` as Array<{ id: number }>;
  return Number(results[0].id);
}

/**
 * Store multiple embeddings in a single transaction (more efficient)
 */
export async function insertEmbeddingsBatch(
  items: Array<{
    content: string;
    embedding: number[];
    metadata: EmbeddingMetadata;
  }>
): Promise<number[]> {
  if (items.length === 0) return [];

  // Build values for batch insert
  const values = items.map((item, idx) => {
    const offset = idx * 3;
    return `($${offset + 1}, $${offset + 2}::vector, $${offset + 3}::jsonb)`;
  }).join(', ');

  const params = items.flatMap(item => [
    item.content,
    JSON.stringify(item.embedding),
    JSON.stringify(item.metadata)
  ]);

  const query = `
    INSERT INTO chat_embeddings (content, embedding, metadata)
    VALUES ${values}
    RETURNING id
  `;

  const sql = getSQL();
  const results = (await sql.query(query, params)) as Array<{ id: number }>;
  return results.map(r => Number(r.id));
}

/**
 * Retrieve relevant content using vector similarity search
 */
interface ResultRow {
  content: string;
  metadata: unknown;
  similarity: number;
}

export async function retrieveRelevantContext(
  queryEmbedding: number[],
  limit: number = 5,
  minSimilarity: number = 0.5
): Promise<RetrievalResult[]> {
  const sql = getSQL();
  const rows = (await sql`
    SELECT
      content,
      metadata,
      1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
    FROM chat_embeddings
    WHERE 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) >= ${minSimilarity}
    ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    LIMIT ${limit}
  `) as ResultRow[];

  return rows.map((row) => {
    return ZRetrievalResult.parse({
      content: row.content,
      metadata: row.metadata,
      similarity: Number(row.similarity),
    });
  });
}

/**
 * Delete all embeddings from a specific source
 * Useful for re-indexing
 */
export async function deleteEmbeddingsBySource(
  source: "blog" | "knowledge"
): Promise<number> {
  const sql = getSQL();
  const result = (await sql`
    DELETE FROM chat_embeddings
    WHERE metadata->>'source' = ${source}
  `) as unknown[];
  return result.length;
}

/**
 * Delete embeddings for a specific blog post (by slug)
 */
export async function deleteEmbeddingsBySlug(slug: string): Promise<number> {
  const sql = getSQL();
  const result = (await sql`
    DELETE FROM chat_embeddings
    WHERE metadata->>'slug' = ${slug}
  `) as unknown[];
  return result.length;
}

/**
 * Delete embeddings for a specific knowledge base file
 */
export async function deleteEmbeddingsByFile(filename: string): Promise<number> {
  const sql = getSQL();
  const result = (await sql`
    DELETE FROM chat_embeddings
    WHERE metadata->>'file' = ${filename}
  `) as unknown[];
  return result.length;
}

/**
 * Get embedding statistics
 */
interface StatsRow {
  total: number;
  blog_count: number;
  knowledge_count: number;
  table_size: string;
}

export async function getEmbeddingStats() {
  const sql = getSQL();
  const results = (await sql`
    SELECT
      count(*) as total,
      count(*) FILTER (WHERE metadata->>'source' = 'blog') as blog_count,
      count(*) FILTER (WHERE metadata->>'source' = 'knowledge') as knowledge_count,
      pg_size_pretty(pg_total_relation_size('chat_embeddings')) as table_size
    FROM chat_embeddings
  `) as StatsRow[];

  const row = results[0];
  return {
    total: Number(row.total),
    blogCount: Number(row.blog_count),
    knowledgeCount: Number(row.knowledge_count),
    tableSize: String(row.table_size),
  };
}

/**
 * Check if the pgvector extension is installed
 */
export async function checkPgvectorInstalled(): Promise<boolean> {
  try {
    const sql = getSQL();
    const results = (await sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as installed
    `) as Array<{ installed: boolean }>;
    return Boolean(results[0]?.installed);
  } catch {
    return false;
  }
}
