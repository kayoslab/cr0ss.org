import { start } from "workflow/api";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/middleware";
import { listPendingContacts } from "@/lib/db/contacts";
import { enrichContactWorkflow } from "@/lib/workflows/enrich-contact";
import { env } from "@/env";

/**
 * Fallback enrichment sweep for any contacts left in `pending`
 * (e.g. if a workflow failed to start at capture time).
 *
 * GET /api/cron/enrich — intended to run on a Vercel Cron schedule.
 * Authenticated with the Vercel-provided `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: Request) {
  const secret = env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return createErrorResponse("Unauthorized", 401, undefined, "UNAUTHORIZED");
  }

  const pending = await listPendingContacts(25);
  const started: string[] = [];

  for (const contact of pending) {
    try {
      await start(enrichContactWorkflow, [contact.id]);
      started.push(contact.id);
    } catch (error) {
      console.error(`Failed to start enrichment for ${contact.id}:`, error);
    }
  }

  return createSuccessResponse({ pending: pending.length, started: started.length });
}
