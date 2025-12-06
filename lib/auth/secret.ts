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

  // Trim secrets to handle any whitespace issues
  const expectedTrimmed = expectedSecret?.trim();
  const providedTrimmed = providedSecret?.trim();

  console.log('[Auth Debug]', {
    hasExpectedSecret: !!expectedSecret,
    expectedSecretLength: expectedSecret?.length || 0,
    expectedTrimmedLength: expectedTrimmed?.length || 0,
    hasProvidedSecret: !!providedSecret,
    providedSecretLength: providedSecret?.length || 0,
    providedTrimmedLength: providedTrimmed?.length || 0,
    secretsMatch: providedSecret === expectedSecret,
    secretsMatchTrimmed: providedTrimmed === expectedTrimmed,
    header: SECRET_HEADER,
    // First/last chars for debugging (don't log full secret)
    expectedFirst3: expectedSecret?.substring(0, 3),
    expectedLast3: expectedSecret?.substring(expectedSecret.length - 3),
    providedFirst3: providedSecret?.substring(0, 3),
    providedLast3: providedSecret?.substring(providedSecret.length - 3),
  });

  // Check standard admin secret header (with trimming to handle whitespace)
  const adminSecret = hdr.get(SECRET_HEADER);
  const expectedAdminSecret = process.env.DASHBOARD_API_SECRET;
  if (adminSecret && expectedAdminSecret &&
      adminSecret.trim() === expectedAdminSecret.trim()) {
    console.log('[Auth Debug] Admin secret matched!');
    return true;
  }

  // Check Contentful webhook secret (used for all Contentful webhooks: revalidation + indexing)
  const revalidateSecret = hdr.get('x-vercel-revalidation-key');
  const expectedRevalidateSecret = process.env.CONTENTFUL_REVALIDATE_SECRET;
  if (revalidateSecret && expectedRevalidateSecret &&
      revalidateSecret.trim() === expectedRevalidateSecret.trim()) {
    console.log('[Auth Debug] Contentful secret matched!');
    return true;
  }

  console.log('[Auth Debug] No secrets matched, returning false');
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
