/**
 * LLM Text Generation using Transformers.js
 * Supports multiple models with easy swapping
 */

import { pipeline, env, TextGenerationPipeline } from "@huggingface/transformers";
import { getCurrentModel } from "./models";

// Configure Transformers.js
if (process.env.NODE_ENV === "production") {
  env.allowRemoteModels = false;
}
env.cacheDir = "./.transformers-cache";

// Set Hugging Face token if available (for gated models)
if (process.env.HF_TOKEN) {
  (env as Record<string, unknown>).HF_TOKEN = process.env.HF_TOKEN;
}

let generationPipeline: TextGenerationPipeline | null = null;
let currentModelId: string | null = null;

/**
 * Get or initialize the text generation pipeline
 */
async function getGenerationPipeline(): Promise<TextGenerationPipeline> {
  const model = getCurrentModel();

  if (!generationPipeline) {
    console.log(`Loading LLM model: ${model.name} (${model.id})...`);
    console.log(`Size: ${model.size}, Quality: ${model.quality}, Speed: ${model.speed}`);

    // Pass HF token if available for authenticated model downloads
    const pipelineOptions: Record<string, unknown> = {};
    if (process.env.HF_TOKEN) {
      pipelineOptions.token = process.env.HF_TOKEN;
    }

    // The pipeline function has a complex union type that TypeScript can't fully resolve
    // We know the return type for "text-generation" task
    const pipelineFn = pipeline as (
      task: "text-generation",
      model: string,
      options?: Record<string, unknown>
    ) => Promise<TextGenerationPipeline>;
    generationPipeline = await pipelineFn("text-generation", model.id, pipelineOptions);

    currentModelId = model.id;
    console.log(`✅ LLM model loaded: ${model.name}`);
  }

  return generationPipeline;
}

/**
 * Format the prompt with system message and context
 */
function formatPrompt(systemPrompt: string, context: string, userMessage: string): string {
  const model = getCurrentModel();

  // Format depends on model - this is a generic format
  // Qwen uses <|im_start|> and <|im_end|> tokens
  // TinyLlama uses a different format
  // Adjust based on model documentation

  if (model.id.includes("Qwen")) {
    // Use /no_think to disable Qwen3's internal reasoning mode (faster responses)
    return `<|im_start|>system
${systemPrompt}

Context:
${context}<|im_end|>
<|im_start|>user
${userMessage} /no_think<|im_end|>
<|im_start|>assistant
`;
  }

  if (model.id.includes("TinyLlama")) {
    return `<|system|>
${systemPrompt}

Context:
${context}</s>
<|user|>
${userMessage}</s>
<|assistant|>
`;
  }

  if (model.id.includes("Phi")) {
    return `<|system|>
${systemPrompt}

Context:
${context}<|end|>
<|user|>
${userMessage}<|end|>
<|assistant|>
`;
  }

  // Generic format for other models
  return `System: ${systemPrompt}

Context:
${context}

User: ${userMessage}

Assistant: `;
}

/**
 * Generate a response from the LLM
 */
export async function generateResponse(
  systemPrompt: string,
  context: string,
  userMessage: string
): Promise<string> {
  const model = getCurrentModel();
  const pipe = await getGenerationPipeline();

  const prompt = formatPrompt(systemPrompt, context, userMessage);

  console.log(`Generating response with ${model.name}...`);

  const output = await pipe(prompt, model.config);

  // Extract the generated text
  // Output structure: TextGenerationOutput[] where TextGenerationOutput = { generated_text: string | Chat }[]
  // For text generation (not chat), generated_text is always a string
  const results = output as { generated_text: string | unknown }[];
  const rawText = results[0]?.generated_text;

  // Handle the case where generated_text might be a Chat array (though it shouldn't be for text generation)
  const generatedText = typeof rawText === 'string'
    ? rawText
    : Array.isArray(rawText)
      ? JSON.stringify(rawText)
      : String(rawText ?? '');

  if (!generatedText) {
    throw new Error("No text generated from model");
  }

  // Extract the assistant's response
  // Different models return output differently - some echo the prompt, some don't
  // Look for assistant markers and extract text after them
  let response = "";

  // Try to find assistant marker (Qwen format)
  const assistantMarkers = [
    "<|im_start|>assistant\n",
    "<|im_start|>assistant",
    "<|assistant|>\n",
    "<|assistant|>",
    "assistant\n",
    "Assistant: ",
  ];

  for (const marker of assistantMarkers) {
    const markerIndex = generatedText.lastIndexOf(marker);
    if (markerIndex !== -1) {
      response = generatedText.slice(markerIndex + marker.length).trim();
      // Remove any trailing tokens
      response = response.replace(/<\|im_end\|>/g, "").replace(/<\/s>/g, "").trim();
      break;
    }
  }

  // If no marker found, try slicing from prompt length (fallback)
  if (!response && generatedText.length > prompt.length) {
    response = generatedText.slice(prompt.length).trim();
  }

  // Post-process to clean up response
  response = cleanupResponse(response);

  console.log(`✅ Response generated (${response.length} chars)`);

  return response;
}

/**
 * Clean up the response text
 */
function cleanupResponse(text: string): string {
  let cleaned = text.trim();

  // Remove Qwen3's <think>...</think> reasoning blocks
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // Remove any trailing incomplete sentence (ends mid-word)
  const lastPunctuation = Math.max(
    cleaned.lastIndexOf('.'),
    cleaned.lastIndexOf('!'),
    cleaned.lastIndexOf('?')
  );
  if (lastPunctuation > 0 && lastPunctuation < cleaned.length - 1) {
    // There's text after the last sentence - remove it
    cleaned = cleaned.slice(0, lastPunctuation + 1);
  }

  // Remove exact duplicate sentences only
  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  const seen = new Set<string>();
  const uniqueSentences: string[] = [];

  for (const sentence of sentences) {
    const normalized = sentence.toLowerCase().trim();
    if (!seen.has(normalized) && sentence.trim().length > 0) {
      seen.add(normalized);
      uniqueSentences.push(sentence);
    }
  }

  const result = uniqueSentences.join(' ').trim();

  // If we ended up with nothing useful, return a fallback
  if (result.length < 20) {
    return "I found relevant information but couldn't generate a proper response. Please try rephrasing your question.";
  }

  return result;
}
