/**
 * Pre-download AI models at build time
 * This ensures models are cached before the app runs
 * Downloads both LLM (text generation) and embedding models
 */

import { pipeline, env } from "@huggingface/transformers";
import { AVAILABLE_MODELS, MODELS_TO_PRELOAD } from "../lib/ai/models";

// Configure cache directory
env.cacheDir = "./.transformers-cache";

// Embedding model used for RAG
const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

async function downloadModels() {
  console.log("🤖 Pre-downloading AI models...\n");

  // Download LLM models
  for (const modelKey of MODELS_TO_PRELOAD) {
    const model = AVAILABLE_MODELS[modelKey as keyof typeof AVAILABLE_MODELS];
    if (!model) {
      console.warn(`⚠️  Model ${modelKey} not found in AVAILABLE_MODELS`);
      continue;
    }

    console.log(`📥 Downloading LLM: ${model.name} (${model.id})`);
    console.log(`   Size: ${model.size}`);

    try {
      // Download by initializing the pipeline
      // The model will be cached for subsequent use
      const pipe = await pipeline("text-generation", model.id);

      // Clean up
      if ("dispose" in pipe) await (pipe as { dispose: () => Promise<void> }).dispose();

      console.log(`✅ ${model.name} downloaded and cached\n`);
    } catch (error) {
      console.error(`❌ Failed to download ${model.name}:`, error);
      process.exit(1);
    }
  }

  // Download embedding model (used for RAG indexing)
  console.log(`📥 Downloading embedding model: ${EMBEDDING_MODEL}`);
  try {
    const embedPipe = await pipeline("feature-extraction", EMBEDDING_MODEL);
    if ("dispose" in embedPipe) await (embedPipe as { dispose: () => Promise<void> }).dispose();
    console.log(`✅ Embedding model downloaded and cached\n`);
  } catch (error) {
    console.error(`❌ Failed to download embedding model:`, error);
    process.exit(1);
  }

  console.log("🎉 All models downloaded successfully!");
}

downloadModels().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
