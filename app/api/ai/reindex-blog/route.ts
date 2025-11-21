// Node runtime for Transformers.js
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds for embedding generation

import { hasValidSecret } from "@/lib/auth/secret";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/middleware";
import { reindexBlogPost } from "@/lib/ai/index-blog-post";
import { z } from "zod";

const ZReindexRequest = z.object({
  slug: z.string().min(1),
});

/**
 * Re-index a single blog post for AI chat
 * Called by the revalidate webhook when a blog post changes
 *
 * POST /api/ai/reindex-blog
 * Body: { slug: "blog-post-slug" }
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

    // Re-index the blog post
    const chunksIndexed = await reindexBlogPost(slug);

    return createSuccessResponse({
      success: true,
      slug,
      chunksIndexed,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Blog post re-indexing error:", error);
    return createErrorResponse(
      "Failed to re-index blog post",
      500,
      error instanceof Error ? error.message : undefined,
      "REINDEX_ERROR"
    );
  }
}
