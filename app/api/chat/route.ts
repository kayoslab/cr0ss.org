// Node runtime - Transformers.js configured to use WASM backend
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds for LLM generation

import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate/limit";
import { createErrorResponse } from "@/lib/api/middleware";
import { retrieveContext, createSystemPrompt } from "@/lib/ai/retrieval";
import { generateResponse } from "@/lib/ai/llm";
import { getCurrentModel } from "@/lib/ai/models";

const ZChatRequest = z.object({
  message: z.string().min(1).max(500),
});

/**
 * Chat endpoint for AI assistant
 * POST /api/chat
 * Body: { message: "user question" }
 *
 * Returns streaming response from LLM
 */
export async function POST(request: Request) {
  try {
    // Rate limiting - 10 requests per minute
    const rl = await rateLimit(request, "ai-chat", {
      windowSec: 60,
      max: 10,
    });

    if (!rl.ok) {
      return createErrorResponse(
        "Too many requests. Please wait a moment before trying again.",
        429,
        { retryAfterSec: rl.retryAfterSec },
        "RATE_LIMIT_EXCEEDED"
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = ZChatRequest.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        "Invalid request",
        400,
        validation.error.issues,
        "VALIDATION_ERROR"
      );
    }

    const { message } = validation.data;

    console.log(`\n🤖 Chat request: "${message}"`);

    // Retrieve relevant context using RAG
    const context = await retrieveContext(message, 5);

    // Generate system prompt
    const systemPrompt = createSystemPrompt();

    // Generate response
    const responseText = await generateResponse(systemPrompt, context, message);

    // Get model info
    const model = getCurrentModel();

    // Return response
    return NextResponse.json({
      response: responseText,
      model: {
        name: model.name,
        size: model.size,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Chat API error:", error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes("model") || error.message.includes("pipeline")) {
        return createErrorResponse(
          "AI model is loading. Please try again in a moment.",
          503,
          process.env.NODE_ENV === "development" ? error.message : undefined,
          "MODEL_LOADING"
        );
      }
    }

    return createErrorResponse(
      "Failed to generate response. Please try again.",
      500,
      process.env.NODE_ENV === "development" ? error : undefined,
      "GENERATION_ERROR"
    );
  }
}
