/**
 * Re-index a single knowledge base entry for AI chat
 * This runs on Node runtime (not Edge)
 */

import { generateEmbedding, chunkText } from "./embeddings";
import { deleteEmbeddingsByFile, insertEmbeddingsBatch } from "../db/embeddings";
import { getKnowledgeBaseBySlug } from "../contentful/api/knowledge-base";

/**
 * Re-index a single knowledge base entry by slug
 * Deletes old embeddings and creates new ones
 */
export async function reindexKnowledgeBase(slug: string): Promise<number> {
  console.log(`Re-indexing knowledge base: ${slug}`);

  // Fetch the knowledge base entry
  const entry = await getKnowledgeBaseBySlug(slug);

  if (!entry) {
    console.warn(`Knowledge base entry not found: ${slug}`);
    return 0;
  }

  // Delete old embeddings for this file (uses slug.md format for backward compatibility)
  await deleteEmbeddingsByFile(`${slug}.md`);

  // Extract content
  const title = entry.title || "";
  const content = entry.content || "";

  // Chunk content
  const chunks = chunkText(content, 1000);

  // Generate embeddings for each chunk
  const items = [];
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i]);

    items.push({
      content: chunks[i],
      embedding,
      metadata: {
        source: "knowledge" as const,
        file: `${slug}.md`,
        title: `${title} (part ${i + 1}/${chunks.length})`,
      },
    });
  }

  // Store in database
  const ids = await insertEmbeddingsBatch(items);

  console.log(`✅ Re-indexed knowledge base "${title}": ${ids.length} chunks`);

  return ids.length;
}
