import { z } from 'zod';
import { start } from 'workflow/api';
import { rateLimit } from '@/lib/rate/limit';
import { validateRequestBody } from '@/lib/api/middleware';
import { apiError, apiSuccess } from '@/lib/api/responses';
import { ZContactSeed } from '@/lib/db/models';
import { insertContactSeed } from '@/lib/db/contacts';
import { enrichContactWorkflow } from '@/lib/workflows/enrich-contact';
import { env } from '@/env';

// The public form also submits a honeypot field which must stay empty.
const ZCaptureRequest = ZContactSeed.extend({
  website: z.string().optional(),
});

/**
 * Public capture endpoint for the portfolio NFC landing page.
 * POST /api/capture
 *
 * Stores a contact seed, kicks off the durable enrichment workflow, and returns
 * a pre-filled wa.me link so the visitor lands in WhatsApp.
 */
export async function POST(request: Request) {
  // Rate limit: 200 submissions/hour per client. Deliberately high because at
  // events many visitors share one NAT/WiFi IP and would otherwise collide.
  const rl = await rateLimit(request, 'capture', { windowSec: 3600, max: 200 });
  if (!rl.ok) {
    return apiError(
      'Too many submissions. Please try again later.',
      429,
      { retryAfterSec: rl.retryAfterSec },
      'RATE_LIMIT_EXCEEDED'
    );
  }

  const parsed = await validateRequestBody(request, ZCaptureRequest);
  if (!parsed.success) return parsed.response;

  const { website, ...seed } = parsed.data;

  // Honeypot tripped — pretend success without storing anything.
  if (website && website.trim().length > 0) {
    return apiSuccess({ ok: true });
  }

  const ownerNumber = env.OWNER_WHATSAPP;
  if (!ownerNumber) {
    return apiError(
      'Capture is not configured yet.',
      503,
      undefined,
      'NOT_CONFIGURED'
    );
  }

  const id = await insertContactSeed(seed);

  // Fire the durable enrichment pipeline. Don't fail the capture if the
  // workflow backend is unavailable — the cron fallback will pick it up.
  try {
    await start(enrichContactWorkflow, [id]);
  } catch (error) {
    console.error('Failed to start enrichment workflow:', error);
  }

  // Build the pre-filled WhatsApp link (open-ended so they can add detail).
  const text = `Hi! We just met — I'm ${seed.name}.`;
  const waUrl = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(text)}`;

  return apiSuccess({ id, waUrl });
}
