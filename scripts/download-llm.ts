/**
 * Pre-download LLM models at build time
 * This ensures the model is cached before the app runs
 */

import { pipeline, env } from "@huggingface/transformers";
import { AVAILABLE_MODELS, MODELS_TO_PRELOAD } from "../lib/ai/models";

// Configure cache directory
env.cacheDir = "./.transformers-cache";

async function downloadModels() {
  console.log("🤖 Pre-downloading LLM models...\n");

  for (const modelKey of MODELS_TO_PRELOAD) {
    const model = AVAILABLE_MODELS[modelKey as keyof typeof AVAILABLE_MODELS];
    if (!model) {
      console.warn(`⚠️  Model ${modelKey} not found in AVAILABLE_MODELS`);
      continue;
    }

    console.log(`📥 Downloading: ${model.name} (${model.id})`);
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

  console.log("🎉 All models downloaded successfully!");
}

downloadModels().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
