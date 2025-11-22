/**
 * LLM Text Generation using Vercel AI Gateway
 * Unified access to multiple AI providers through a single API
 */

import { generateText, streamText, createGateway } from "ai";

// Create gateway instance with API key
const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? "",
});

// Model configuration
interface ModelConfig {
  /** Model identifier in provider/model format */
  id: string;
  /** Human-readable name */
  name: string;
  /** Provider name for display */
  provider: string;
  /** Maximum output tokens */
  maxTokens: number;
}

// Available models via AI Gateway
const MODELS: Record<string, ModelConfig> = {
  // OpenAI models
  "gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    maxTokens: 500,
  },
  "gpt-4o": {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    maxTokens: 500,
  },
  // Anthropic models
  "claude-3-haiku": {
    id: "anthropic/claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    provider: "anthropic",
    maxTokens: 500,
  },
  "claude-3-5-sonnet": {
    id: "anthropic/claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    maxTokens: 500,
  },
};

// Default model - can be overridden via environment variable
const DEFAULT_MODEL = "gpt-4o-mini";

/**
 * Get the current model configuration
 */
export function getCurrentModel(): ModelConfig {
  const modelKey = process.env.AI_MODEL || DEFAULT_MODEL;
  const model = MODELS[modelKey];

  if (!model) {
    console.warn(`Unknown model "${modelKey}", falling back to ${DEFAULT_MODEL}`);
    return MODELS[DEFAULT_MODEL];
  }

  return model;
}

/**
 * Generate a response from the LLM via AI Gateway
 */
export async function generateResponse(
  systemPrompt: string,
  context: string,
  userMessage: string
): Promise<string> {
  const config = getCurrentModel();

  console.log(`Generating response with ${config.name} via AI Gateway...`);

  // Combine system prompt with context
  const fullSystemPrompt = `${systemPrompt}

Context:
${context}`;

  const { text } = await generateText({
    model: gateway(config.id),
    system: fullSystemPrompt,
    prompt: userMessage,
    maxOutputTokens: config.maxTokens,
    temperature: 0.7,
  });

  console.log(`Response generated (${text.length} chars)`);

  return text;
}

/**
 * Generate a streaming response from the LLM via AI Gateway
 * Returns a ReadableStream for streaming responses
 */
export async function generateStreamingResponse(
  systemPrompt: string,
  context: string,
  userMessage: string
) {
  const config = getCurrentModel();

  console.log(`Streaming response with ${config.name} via AI Gateway...`);

  // Combine system prompt with context
  const fullSystemPrompt = `${systemPrompt}

Context:
${context}`;

  const result = streamText({
    model: gateway(config.id),
    system: fullSystemPrompt,
    prompt: userMessage,
    maxOutputTokens: config.maxTokens,
    temperature: 0.7,
  });

  return result;
}
