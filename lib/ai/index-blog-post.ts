/**
 * Re-index a single blog post for AI chat
 * This runs on Node runtime (not Edge)
 */

import { generateEmbedding, chunkText } from "./embeddings";
import { deleteEmbeddingsBySlug, insertEmbeddingsBatch } from "../db/embeddings";
import { getBlog } from "../contentful/api/blog";
import type { BlogProps } from "../contentful/api/props/blog";

/**
 * Re-index a single blog post by slug
 * Deletes old embeddings and creates new ones
 */
export async function reindexBlogPost(slug: string): Promise<number> {
  console.log(`Re-indexing blog post: ${slug}`);

  // Fetch the blog post
  const blog = await getBlog(slug) as unknown as BlogProps | null;

  if (!blog) {
    console.warn(`Blog post not found: ${slug}`);
    return 0;
  }

  // Delete old embeddings for this slug
  await deleteEmbeddingsBySlug(slug);

  // Extract content
  const title = blog.title || "";
  const summary = blog.summary || "";
  const seoDescription = blog.seoDescription || "";

  const content = `Title: ${title}\n\nSummary: ${summary}\n\n${seoDescription}`.trim();

  // Chunk content
  const chunks = chunkText(content, 1500);

  // Generate embeddings for each chunk
  const items = [];
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i]);

    items.push({
      content: chunks[i],
      embedding,
      metadata: {
        source: "blog" as const,
        slug,
        title,
        url: `https://cr0ss.org/blog/${slug}`,
      },
    });
  }

  // Store in database
  const ids = await insertEmbeddingsBatch(items);

  console.log(`✅ Re-indexed blog post "${title}": ${ids.length} chunks`);

  return ids.length;
}
