export const runtime = "nodejs";
export const maxDuration = 60;

import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { searchContacts } from "@/lib/db/contacts";

/**
 * MCP server exposing the private "contact memory" as a single read-only tool.
 * The Vercel Eve agent connects to this endpoint and calls `search_contacts`.
 *
 * Streamable HTTP endpoint: /api/mcp/mcp
 */
const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "search_contacts",
      {
        title: "Search contacts",
        description:
          "Semantic recall over the people I've met. Ask in plain English, " +
          'e.g. "who was the fintech founder from the Shoreditch event".',
        inputSchema: {
          query: z
            .string()
            .describe("Plain-English description of who you are looking for"),
          limit: z.number().int().min(1).max(20).optional(),
        },
      },
      async ({ query, limit }) => {
        const embedding = await generateEmbedding(query);
        // Return the top-K nearest (ranked best-first) with no hard similarity
        // floor — the agent judges relevance. A fixed threshold drops valid
        // matches because the 384-dim embeddings compress cosine scores.
        const results = await searchContacts(embedding, limit ?? 5, 0);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }
    );
  },
  {},
  { basePath: "/api/mcp", maxDuration: 60 }
);

/**
 * Owner-only gate: require a bearer token matching MCP_BEARER_TOKEN.
 * This is the baseline hard gate; in production Vercel Connect / Sign in with
 * Vercel brokers a scoped OIDC identity in front of it (see agent/ + docs).
 */
const verifyToken = async (_req: Request, bearerToken?: string) => {
  const expected = process.env.MCP_BEARER_TOKEN;
  if (!expected || !bearerToken || bearerToken !== expected) {
    return undefined;
  }
  return {
    token: bearerToken,
    clientId: "owner",
    scopes: ["contacts:read"],
  };
};

const authHandler = withMcpAuth(handler, verifyToken, { required: true });

export { authHandler as GET, authHandler as POST };
