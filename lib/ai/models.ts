/**
 * LLM Model Configuration
 * Makes it easy to swap between different Transformers.js models
 */

export interface ModelConfig {
  /** Model ID from Hugging Face */
  id: string;
  /** Human-readable name */
  name: string;
  /** Model size in parameters */
  size: string;
  /** Expected response quality */
  quality: "low" | "medium" | "high";
  /** Approximate inference time */
  speed: "fast" | "medium" | "slow";
  /** Maximum context length (tokens) */
  maxContext: number;
  /** Generation config (snake_case for Transformers.js) */
  config: {
    max_new_tokens: number;
    temperature: number;
    top_p: number;
    top_k: number;
    repetition_penalty: number;
    do_sample: boolean;
  };
}

/**
 * Available model configurations
 */
export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  "qwen3-0.6b": {
    id: "onnx-community/Qwen3-0.6B-ONNX",
    name: "Qwen3 0.6B",
    size: "600M",
    quality: "medium",
    speed: "fast",
    maxContext: 4096,
    config: {
      max_new_tokens: 300,
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      repetition_penalty: 1.15,
      do_sample: true,
    },
  },

  "qwen1.5-0.5b": {
    id: "Xenova/Qwen1.5-0.5B-Chat",
    name: "Qwen 1.5 0.5B Chat",
    size: "500M",
    quality: "medium",
    speed: "fast",
    maxContext: 2048,
    config: {
      max_new_tokens: 150,
      temperature: 0.4,
      top_p: 0.85,
      top_k: 30,
      repetition_penalty: 1.3,
      do_sample: true,
    },
  },

  "tinyllama-1.1b": {
    id: "Xenova/TinyLlama-1.1B-Chat-v1.0",
    name: "TinyLlama 1.1B Chat",
    size: "1.1B",
    quality: "medium",
    speed: "medium",
    maxContext: 2048,
    config: {
      max_new_tokens: 200,
      temperature: 0.5,
      top_p: 0.85,
      top_k: 30,
      repetition_penalty: 1.5,
      do_sample: true,
    },
  },

  "phi-3-mini": {
    id: "Xenova/Phi-3-mini-4k-instruct",
    name: "Phi-3 Mini 3.8B",
    size: "3.8B",
    quality: "high",
    speed: "slow",
    maxContext: 4096,
    config: {
      max_new_tokens: 512,
      temperature: 0.7,
      top_p: 0.95,
      top_k: 50,
      repetition_penalty: 1.1,
      do_sample: true,
    },
  },

  "smollm-135m": {
    id: "HuggingFaceTB/SmolLM-135M-Instruct",
    name: "SmolLM 135M",
    size: "135M",
    quality: "low",
    speed: "fast",
    maxContext: 2048,
    config: {
      max_new_tokens: 256,
      temperature: 0.7,
      top_p: 0.9,
      top_k: 50,
      repetition_penalty: 1.2,
      do_sample: true,
    },
  },
};

/**
 * Default model selection
 */
export const DEFAULT_MODEL_KEY: keyof typeof AVAILABLE_MODELS = "qwen3-0.6b";

/**
 * Models to pre-download at build time
 */
export const MODELS_TO_PRELOAD = ["qwen3-0.6b"];

/**
 * Get the current/default model configuration
 */
export function getCurrentModel(): ModelConfig {
  return AVAILABLE_MODELS[DEFAULT_MODEL_KEY];
}

/**
 * Get model configuration by key
 */
export function getModel(key: string): ModelConfig | undefined {
  return AVAILABLE_MODELS[key as keyof typeof AVAILABLE_MODELS];
}
