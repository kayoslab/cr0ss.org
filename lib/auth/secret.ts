import { SECRET_HEADER } from "./constants";
import { env } from '@/env';

/**
 * Returns true if the provided Request carries a valid secret header.
 * Supports two authentication methods:
 * - Standard: x-admin-secret (DASHBOARD_API_SECRET)
 * - Contentful webhooks: x-vercel-revalidation-key (CONTENTFUL_REVALIDATE_SECRET)
 */
export function hasValidSecret(req: Request): boolean {
  const hdr = new Headers(req.headers);

  // Check standard admin secret header
  const adminSecret = hdr.get(SECRET_HEADER);
  if (adminSecret && adminSecret === env.DASHBOARD_API_SECRET) {
    return true;
  }

  // Check Contentful webhook secret (used for all Contentful webhooks: revalidation + indexing)
  const revalidateSecret = hdr.get('x-vercel-revalidation-key');
  if (revalidateSecret && revalidateSecret === env.CONTENTFUL_REVALIDATE_SECRET) {
    return true;
  }

  return false;
}

/** Throws a 401 JSON response if secret is missing/invalid. */
export function assertSecret(req: Request) {
  if (!hasValidSecret(req)) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
}
