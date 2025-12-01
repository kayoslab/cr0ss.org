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
  const isAdminValid = adminSecret === env.DASHBOARD_API_SECRET;

  // Enhanced logging for debugging
  const url = new URL(req.url);
  console.log('[Auth] Secret validation:', {
    path: url.pathname,
    hasAdminHeader: !!adminSecret,
    adminHeaderLength: adminSecret?.length,
    expectedLength: env.DASHBOARD_API_SECRET?.length,
    isAdminValid,
    // Only log first/last 4 chars for security
    receivedPrefix: adminSecret?.slice(0, 4),
    receivedSuffix: adminSecret?.slice(-4),
    expectedPrefix: env.DASHBOARD_API_SECRET?.slice(0, 4),
    expectedSuffix: env.DASHBOARD_API_SECRET?.slice(-4),
    allHeaders: Array.from(hdr.keys()),
  });

  if (adminSecret && isAdminValid) {
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
    const url = new URL(req.url);
    console.error('[Auth] Unauthorized request:', {
      path: url.pathname,
      method: req.method,
      headers: Array.from(new Headers(req.headers).keys()),
    });

    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
}
