/**
 * Embedding generation using Transformers.js
 * Model: all-MiniLM-L6-v2 (384 dimensions)
 * Runs locally on Node.js/Edge - no API calls needed
 */

import { pipeline, env, FeatureExtractionPipeline, Tensor } from "@huggingface/transformers";

// Configure Transformers.js for serverless environment
// Use WASM backend (works on Vercel serverless, unlike native onnxruntime-node)
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/";
}
env.cacheDir = "./.transformers-cache";

// Type for the embedding pipeline call signature
type EmbeddingPipelineFn = (
  texts: string | string[],
  options?: { pooling?: string; normalize?: boolean }
) => Promise<Tensor>;

let embeddingPipeline: EmbeddingPipelineFn | null = null;

/**
 * Get or initialize the embedding pipeline
 * Uses all-MiniLM-L6-v2 model (384 dimensions)
 */
async function getEmbeddingPipeline(): Promise<EmbeddingPipelineFn> {
  if (!embeddingPipeline) {
    console.log("Loading embedding model (all-MiniLM-L6-v2)...");
    // The pipeline function has a complex union type that TypeScript can't fully resolve
    // We know the return type for "feature-extraction" task
    const pipelineFn = pipeline as (
      task: "feature-extraction",
      model: string
    ) => Promise<FeatureExtractionPipeline>;
    const pipe = await pipelineFn("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    embeddingPipeline = pipe as unknown as EmbeddingPipelineFn;
    console.log("✅ Embedding model loaded");
  }
  return embeddingPipeline;
}

/**
 * Generate embedding for a single text
 * @param text - Text to embed
 * @returns 384-dimensional embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const pipe = await getEmbeddingPipeline();

  // Generate embedding
  const output = await pipe(text, {
    pooling: "mean",
    normalize: true,
  });

  // Extract the embedding array
  const embedding = Array.from(output.data) as number[];

  if (embedding.length !== 384) {
    throw new Error(`Expected 384 dimensions, got ${embedding.length}`);
  }

  return embedding;
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

  const pipe = await getEmbeddingPipeline();

  // Process in batches of 32 for optimal performance
  const batchSize = 32;
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`Processing embeddings batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}...`);

    const outputs = await pipe(batch, {
      pooling: "mean",
      normalize: true,
    });

    // For batch processing, outputs.data contains all embeddings concatenated
    // We need to reshape it into individual 384-dim vectors
    const data = Array.from(outputs.data) as number[];
    const numEmbeddings = batch.length;
    const embeddingDim = 384;

    for (let j = 0; j < numEmbeddings; j++) {
      const start = j * embeddingDim;
      const end = start + embeddingDim;
      embeddings.push(data.slice(start, end));
    }
  }

  // Validate dimensions
  for (const embedding of embeddings) {
    if (embedding.length !== 384) {
      throw new Error(`Expected 384 dimensions, got ${embedding.length}`);
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
