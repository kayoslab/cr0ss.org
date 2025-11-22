// Vercel AI SDK - works on serverless
export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate/limit";
import { createErrorResponse } from "@/lib/api/middleware";
import { retrieveContext, createSystemPrompt } from "@/lib/ai/retrieval";
import { generateResponse, getCurrentModel } from "@/lib/ai/llm";

const ZChatRequest = z.object({
  message: z.string().min(1).max(500),
});

/**
 * Chat endpoint for AI assistant
 * POST /api/chat
 * Body: { message: "user question" }
 *
 * Uses openai/gpt-4o-mini via Vercel AI Gateway
 * Rate limited to 10 requests per 12 hours per user
 */
export async function POST(request: Request) {
  try {
    // Rate limiting - 10 requests per 12 hours (to control AI costs)
    const TWELVE_HOURS_SEC = 12 * 60 * 60; // 43200 seconds
    const rl = await rateLimit(request, "ai-chat", {
      windowSec: TWELVE_HOURS_SEC,
      max: 10,
    });

    if (!rl.ok) {
      return createErrorResponse(
        "You've reached your chat limit. Please try again later.",
        429,
        { retryAfterSec: rl.retryAfterSec, limit: 10, windowHours: 12 },
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

    // Generate response using Vercel AI SDK
    const responseText = await generateResponse(systemPrompt, context, message);

    // Get model info
    const model = getCurrentModel();

    // Return response
    return NextResponse.json({
      response: responseText,
      model: {
        name: model.name,
        provider: model.provider,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Chat API error:", error);

    // Check for specific error types
    if (error instanceof Error) {
      // API key errors
      if (
        error.message.includes("API key") ||
        error.message.includes("authentication")
      ) {
        return createErrorResponse(
          "AI service configuration error. Please try again later.",
          503,
          process.env.NODE_ENV === "development" ? error.message : undefined,
          "API_CONFIG_ERROR"
        );
      }

      // Rate limit from provider
      if (error.message.includes("rate limit")) {
        return createErrorResponse(
          "AI service is busy. Please try again in a moment.",
          503,
          process.env.NODE_ENV === "development" ? error.message : undefined,
          "PROVIDER_RATE_LIMIT"
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
