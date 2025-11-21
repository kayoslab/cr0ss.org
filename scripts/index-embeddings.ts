/**
 * Index all content for AI chat assistant
 * - Knowledge base markdown files
 * - Blog posts from Contentful
 *
 * Run with: pnpm ai:index
 * Can be run during build or manually
 */

import "./load-env"; // Load environment variables first
import fs from "fs";
import path from "path";
import { generateEmbeddingsBatch, chunkText } from "../lib/ai/embeddings";
import { insertEmbeddingsBatch, deleteEmbeddingsBySource, getEmbeddingStats } from "../lib/db/embeddings";
import { fetchGraphQLForScript } from "../lib/contentful/api/script-api";
import type { EmbeddingMetadata } from "../lib/db/models";

// Simplified fields for indexing (to avoid complex query errors)
const BLOG_INDEX_FIELDS = `
  sys {
    id
  }
  title
  slug
  summary
  seoDescription
`;

interface DocumentToIndex {
  content: string;
  metadata: EmbeddingMetadata;
}

/**
 * Index knowledge base markdown files
 */
async function indexKnowledgeBase(): Promise<DocumentToIndex[]> {
  console.log("\n📚 Indexing knowledge base...");

  const knowledgeDir = path.join(process.cwd(), "lib/ai/knowledge-base");
  const files = fs.readdirSync(knowledgeDir).filter(f => f.endsWith(".md") && f !== "README.md");

  const documents: DocumentToIndex[] = [];

  for (const file of files) {
    const filePath = path.join(knowledgeDir, file);
    const content = fs.readFileSync(filePath, "utf-8");

    // Remove HTML comments from content
    const cleanContent = content.replace(/<!--[\s\S]*?-->/g, "");

    // Chunk the content for better retrieval
    const chunks = chunkText(cleanContent, 1000);

    console.log(`   📄 ${file}: ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      documents.push({
        content: chunks[i],
        metadata: {
          source: "knowledge",
          file: file,
          title: `${file.replace(".md", "")} (part ${i + 1}/${chunks.length})`,
        },
      });
    }
  }

  console.log(`   ✅ ${documents.length} knowledge base chunks prepared`);
  return documents;
}

/**
 * Index blog posts from Contentful
 */
async function indexBlogPosts(): Promise<DocumentToIndex[]> {
  console.log("\n📝 Indexing blog posts...");

  const documents: DocumentToIndex[] = [];

  // Fetch all blogs (paginated)
  let page = 1;
  let hasMore = true;
  const limit = 100; // Fetch in batches

  while (hasMore) {
    console.log(`   Fetching page ${page}...`);

    const query = `query {
      blogPostCollection(
        order: sys_firstPublishedAt_DESC,
        limit: ${limit},
        skip: ${(page - 1) * limit},
        preview: false
      ) {
        total
        skip
        limit
        items {
          ${BLOG_INDEX_FIELDS}
        }
      }
    }`;

    const response = await fetchGraphQLForScript(query);
    const result = response?.data?.blogPostCollection;

    console.log(`   Result:`, {
      hasResult: !!result,
      itemsCount: result?.items?.length || 0,
      total: result?.total || 0
    });

    if (!result || result.items.length === 0) {
      hasMore = false;
      break;
    }

    for (const blog of result.items) {
      // Extract relevant content
      const title = (blog.title as string) || "";
      const summary = (blog.summary as string) || "";
      const seoDescription = (blog.seoDescription as string) || "";
      const slug = (blog.slug as string) || "";

      // Combine into searchable content
      const content = `Title: ${title}\n\nSummary: ${summary}\n\nDescription: ${seoDescription}`.trim();

      // Chunk if content is very long
      const chunks = chunkText(content, 1500);

      for (let i = 0; i < chunks.length; i++) {
        documents.push({
          content: chunks[i],
          metadata: {
            source: "blog",
            slug: slug,
            title: title,
            url: `https://cr0ss.org/blog/${slug}`,
          },
        });
      }
    }

    console.log(`   Page ${page}: ${result.items.length} posts`);

    // Check if there are more pages
    hasMore = result.skip + result.items.length < result.total;
    page++;
  }

  console.log(`   ✅ ${documents.length} blog post chunks prepared`);
  return documents;
}

/**
 * Main indexing function
 */
async function main() {
  console.log("🚀 Starting AI content indexing...\n");

  const startTime = Date.now();

  try {
    // Show current stats
    console.log("📊 Current stats:");
    const currentStats = await getEmbeddingStats();
    console.log(`   Total embeddings: ${currentStats.total}`);
    console.log(`   Blog posts: ${currentStats.blogCount}`);
    console.log(`   Knowledge base: ${currentStats.knowledgeCount}`);

    // Index knowledge base
    const knowledgeDocuments = await indexKnowledgeBase();

    // Index blog posts
    const blogDocuments = await indexBlogPosts();

    const allDocuments = [...knowledgeDocuments, ...blogDocuments];

    if (allDocuments.length === 0) {
      console.log("\n⚠️  No documents to index");
      return;
    }

    console.log(`\n🔤 Generating ${allDocuments.length} embeddings...`);
    console.log("   (This may take a few minutes on first run to download the model)\n");

    // Generate embeddings
    const texts = allDocuments.map(d => d.content);
    const embeddings = await generateEmbeddingsBatch(texts);

    console.log(`\n✅ Generated ${embeddings.length} embeddings`);

    // Clear old data
    console.log("\n🗑️  Clearing old embeddings...");
    const deletedKnowledge = await deleteEmbeddingsBySource("knowledge");
    const deletedBlog = await deleteEmbeddingsBySource("blog");
    console.log(`   Deleted ${deletedKnowledge} knowledge base + ${deletedBlog} blog embeddings`);

    // Store in database
    console.log("\n💾 Storing embeddings in database...");

    const items = allDocuments.map((doc, i) => ({
      content: doc.content,
      embedding: embeddings[i],
      metadata: doc.metadata,
    }));

    const ids = await insertEmbeddingsBatch(items);
    console.log(`   ✅ Stored ${ids.length} embeddings`);

    // Show final stats
    console.log("\n📊 Final stats:");
    const finalStats = await getEmbeddingStats();
    console.log(`   Total embeddings: ${finalStats.total}`);
    console.log(`   Blog posts: ${finalStats.blogCount}`);
    console.log(`   Knowledge base: ${finalStats.knowledgeCount}`);
    console.log(`   Database size: ${finalStats.tableSize}`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🎉 Indexing complete in ${duration}s!\n`);

  } catch (error) {
    console.error("\n❌ Indexing failed:", error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
