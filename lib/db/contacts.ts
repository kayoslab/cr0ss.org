import { sql } from './client';
import {
  ZContactSearchResult,
  type AnchorType,
  type ContactSeed,
  type ContactStatus,
  type ContactSearchResult,
  type ProfileMetadata,
} from './models';

/**
 * Store a captured contact seed (from the public portfolio form).
 * Returns the generated contact id (uuid).
 */
export async function insertContactSeed(seed: ContactSeed): Promise<string> {
  const rows = (await sql`
    INSERT INTO contacts (name, anchor_type, anchor_value, message, source, campaign_id, status)
    VALUES (
      ${seed.name},
      ${seed.anchorType},
      ${seed.anchorValue},
      ${seed.message ?? null},
      ${seed.source},
      ${seed.campaignId ?? null},
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
  const enrichedAt = status === 'enriched' ? new Date().toISOString() : null;
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
  campaignId: string | null;
} | null> {
  const rows = (await sql`
    SELECT id, name, anchor_type, anchor_value, message, campaign_id
    FROM contacts
    WHERE id = ${id}
    LIMIT 1
  `) as Array<{
    id: string;
    name: string;
    anchor_type: AnchorType;
    anchor_value: string;
    message: string | null;
    campaign_id: string | null;
  }>;
  const row = rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name,
    anchorType: row.anchor_type,
    anchorValue: row.anchor_value,
    message: row.message,
    campaignId: row.campaign_id,
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
