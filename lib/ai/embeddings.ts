/**
 * Embedding generation using Vercel AI Gateway
 * Used for RAG (Retrieval-Augmented Generation)
 *
 * Note: OpenAI embeddings produce 1536-dimensional vectors by default.
 * We use dimensions: 384 for compatibility with existing pgvector index.
 */

import { embedMany, embed, createGateway } from "ai";

// Create gateway instance with API key
const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? "",
});

// Model configuration
const EMBEDDING_MODEL = "openai/text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 384; // Match existing pgvector index

/**
 * Generate embedding for a single text
 * @param text - Text to embed
 * @returns 384-dimensional embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: gateway.textEmbeddingModel(EMBEDDING_MODEL),
    value: text,
    experimental_telemetry: { isEnabled: false },
  });

  // OpenAI text-embedding-3-small returns 1536 dimensions by default
  // We truncate to 384 for compatibility with existing pgvector index
  const truncated = embedding.slice(0, EMBEDDING_DIMENSIONS);

  if (truncated.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${truncated.length}`);
  }

  return truncated;
}

/**
 * Generate embeddings for multiple texts (batch processing)
 * More efficient than calling generateEmbedding multiple times
 * @param texts - Array of texts to embed
 * @returns Array of 384-dimensional embedding vectors
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  if (texts.length === 0) return [];

  // Process in batches of 100 for optimal performance
  const batchSize = 100;
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`Processing embeddings batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}...`);

    const { embeddings: batchEmbeddings } = await embedMany({
      model: gateway.textEmbeddingModel(EMBEDDING_MODEL),
      values: batch,
      experimental_telemetry: { isEnabled: false },
    });

    // Truncate each embedding to 384 dimensions
    const truncatedBatch = batchEmbeddings.map(emb => emb.slice(0, EMBEDDING_DIMENSIONS));
    embeddings.push(...truncatedBatch);
  }

  // Validate dimensions
  for (const embedding of embeddings) {
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${embedding.length}`);
    }
  }

  return embeddings;
}

/**
 * Chunk text into smaller pieces for better retrieval
 * @param text - Text to chunk
 * @param maxChars - Maximum characters per chunk (default: 1000)
 * @returns Array of text chunks
 */
export function chunkText(text: string, maxChars: number = 1000): string[] {
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    // If adding this paragraph would exceed limit and we have content
    if (currentChunk.length > 0 && (currentChunk.length + para.length) > maxChars) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + para;
    }
  }

  // Add remaining content
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // If we still have chunks that are too large, split them by sentences
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= maxChars) {
      finalChunks.push(chunk);
    } else {
      // Split by sentences
      const sentences = chunk.split(/[.!?]+/).filter(s => s.trim().length > 0);
      let subChunk = "";

      for (const sentence of sentences) {
        if (subChunk.length > 0 && (subChunk.length + sentence.length) > maxChars) {
          finalChunks.push(subChunk.trim());
          subChunk = sentence;
        } else {
          subChunk += (subChunk ? ". " : "") + sentence.trim();
        }
      }

      if (subChunk.trim()) {
        finalChunks.push(subChunk.trim());
      }
    }
  }

  return finalChunks.length > 0 ? finalChunks : [text];
}
