import { SECRET_HEADER } from "./constants";

/**
 * Returns true if the provided Request carries a valid secret header.
 * Supports two authentication methods:
 * - Standard: x-admin-secret (DASHBOARD_API_SECRET)
 * - Contentful webhooks: x-vercel-revalidation-key (CONTENTFUL_REVALIDATE_SECRET)
 *
 * Note: We access process.env directly instead of using the env module
 * because the env module's experimental__runtimeEnv doesn't work properly
 * with Edge runtime. Edge runtime does support process.env access.
 */
export function hasValidSecret(req: Request): boolean {
  const hdr = new Headers(req.headers);

  // Debug logging for Vercel Edge runtime
  const expectedSecret = process.env.DASHBOARD_API_SECRET;
  const providedSecret = hdr.get(SECRET_HEADER);

  console.log('[Auth Debug]', {
    hasExpectedSecret: !!expectedSecret,
    expectedSecretLength: expectedSecret?.length || 0,
    hasProvidedSecret: !!providedSecret,
    providedSecretLength: providedSecret?.length || 0,
    secretsMatch: providedSecret === expectedSecret,
    header: SECRET_HEADER,
  });

  // Check standard admin secret header
  const adminSecret = hdr.get(SECRET_HEADER);
  if (adminSecret && adminSecret === process.env.DASHBOARD_API_SECRET) {
    return true;
  }

  // Check Contentful webhook secret (used for all Contentful webhooks: revalidation + indexing)
  const revalidateSecret = hdr.get('x-vercel-revalidation-key');
  if (revalidateSecret && revalidateSecret === process.env.CONTENTFUL_REVALIDATE_SECRET) {
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
