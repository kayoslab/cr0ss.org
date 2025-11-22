// Node runtime for Transformers.js
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds for embedding generation

import { hasValidSecret } from "@/lib/auth/secret";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/middleware";
import { reindexKnowledgeBase } from "@/lib/ai/index-knowledge-base";
import { z } from "zod";

const ZReindexRequest = z.object({
  slug: z.string().min(1),
});

/**
 * Re-index a single knowledge base entry for AI chat
 * Called by the revalidate webhook when a knowledge base entry changes
 *
 * POST /api/ai/reindex-knowledge
 * Body: { slug: "about-me" }
 * Headers: x-vercel-revalidation-key: SECRET
 */
export async function POST(request: Request) {
  // Check for valid secret
  if (!hasValidSecret(request)) {
    return createErrorResponse("Unauthorized", 401, undefined, "UNAUTHORIZED");
  }

  try {
    const body = await request.json();
    const validation = ZReindexRequest.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        "Invalid request",
        400,
        validation.error.issues,
        "VALIDATION_ERROR"
      );
    }

    const { slug } = validation.data;

    // Re-index the knowledge base entry
    const chunksIndexed = await reindexKnowledgeBase(slug);

    return createSuccessResponse({
      success: true,
      slug,
      chunksIndexed,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Knowledge base re-indexing error:", error);
    return createErrorResponse(
      "Failed to re-index knowledge base",
      500,
      error instanceof Error ? error.message : undefined,
      "REINDEX_ERROR"
    );
  }
}
