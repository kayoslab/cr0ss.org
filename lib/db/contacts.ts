import { neon } from "@neondatabase/serverless";
import {
  ZContactSearchResult,
  type AnchorType,
  type ContactSeed,
  type ContactStatus,
  type ContactSearchResult,
  type ProfileMetadata,
} from "./models";

// Lazy-load SQL connection so environment variables can be set first.
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
 * Store a captured contact seed (from the public portfolio form).
 * Returns the generated contact id (uuid).
 */
export async function insertContactSeed(seed: ContactSeed): Promise<string> {
  const sql = getSQL();
  const rows = (await sql`
    INSERT INTO contacts (name, anchor_type, anchor_value, message, source, status)
    VALUES (
      ${seed.name},
      ${seed.anchorType},
      ${seed.anchorValue},
      ${seed.message ?? null},
      ${seed.source},
      'pending'
    )
    RETURNING id
  `) as Array<{ id: string }>;
  return String(rows[0].id);
}

/**
 * Update the enrichment status of a contact, optionally attaching the Apify
 * run id and stamping enriched_at when the job completes.
 */
export async function setContactStatus(
  id: string,
  status: ContactStatus,
  extra: { apifyRunId?: string } = {}
): Promise<void> {
  const sql = getSQL();
  const enrichedAt = status === "enriched" ? new Date().toISOString() : null;
  await sql`
    UPDATE contacts
    SET status = ${status},
        apify_run_id = COALESCE(${extra.apifyRunId ?? null}, apify_run_id),
        enriched_at = COALESCE(${enrichedAt}, enriched_at)
    WHERE id = ${id}
  `;
}

/** Load a single contact seed by id (used by the enrichment workflow). */
export async function getContactById(id: string): Promise<{
  id: string;
  name: string;
  anchorType: AnchorType;
  anchorValue: string;
  message: string | null;
} | null> {
  const sql = getSQL();
  const rows = (await sql`
    SELECT id, name, anchor_type, anchor_value, message
    FROM contacts
    WHERE id = ${id}
    LIMIT 1
  `) as Array<{
    id: string;
    name: string;
    anchor_type: AnchorType;
    anchor_value: string;
    message: string | null;
  }>;
  const row = rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name,
    anchorType: row.anchor_type,
    anchorValue: row.anchor_value,
    message: row.message,
  };
}

/** Contacts still awaiting enrichment (used by the cron fallback). */
export async function listPendingContacts(limit = 25): Promise<
  Array<{
    id: string;
    name: string;
    anchorType: AnchorType;
    anchorValue: string;
  }>
> {
  const sql = getSQL();
  const rows = (await sql`
    SELECT id, name, anchor_type, anchor_value
    FROM contacts
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT ${limit}
  `) as Array<{
    id: string;
    name: string;
    anchor_type: AnchorType;
    anchor_value: string;
  }>;
  return rows.map((r) => ({
    id: String(r.id),
    name: r.name,
    anchorType: r.anchor_type,
    anchorValue: r.anchor_value,
  }));
}

/**
 * Store the embedding + enriched profile for a contact.
 * `embedding` is a 384-dimensional vector (see lib/ai/embeddings.ts).
 */
export async function insertContactEmbedding(
  contactId: string,
  content: string,
  embedding: number[],
  profile: ProfileMetadata
): Promise<number> {
  const sql = getSQL();
  const rows = (await sql`
    INSERT INTO contact_embeddings (contact_id, content, embedding, profile)
    VALUES (
      ${contactId},
      ${content},
      ${JSON.stringify(embedding)}::vector,
      ${JSON.stringify(profile)}::jsonb
    )
    RETURNING id
  `) as Array<{ id: number }>;
  return Number(rows[0].id);
}

interface SearchRow {
  contact_id: string;
  name: string;
  anchor_type: AnchorType;
  anchor_value: string;
  content: string;
  profile: unknown;
  similarity: number;
}

/**
 * Plain-English recall: nearest enriched contacts to a query embedding.
 * Cosine similarity via pgvector's `<=>` operator, joined back to the seed row.
 */
export async function searchContacts(
  queryEmbedding: number[],
  limit = 5,
  minSimilarity = 0.15
): Promise<ContactSearchResult[]> {
  const sql = getSQL();
  const vec = JSON.stringify(queryEmbedding);
  const rows = (await sql`
    SELECT
      c.id AS contact_id,
      c.name AS name,
      c.anchor_type AS anchor_type,
      c.anchor_value AS anchor_value,
      ce.content AS content,
      ce.profile AS profile,
      1 - (ce.embedding <=> ${vec}::vector) AS similarity
    FROM contact_embeddings ce
    JOIN contacts c ON c.id = ce.contact_id
    WHERE 1 - (ce.embedding <=> ${vec}::vector) >= ${minSimilarity}
    ORDER BY ce.embedding <=> ${vec}::vector
    LIMIT ${limit}
  `) as SearchRow[];

  return rows.map((row) =>
    ZContactSearchResult.parse({
      contactId: String(row.contact_id),
      name: row.name,
      anchorType: row.anchor_type,
      anchorValue: row.anchor_value,
      content: row.content,
      profile: row.profile,
      similarity: Number(row.similarity),
    })
  );
}
