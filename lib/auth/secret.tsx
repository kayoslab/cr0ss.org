import { SECRET_HEADER } from "./constants";

/**
 * Returns true if the provided Request carries a valid secret header.
 * Canonical env: DASHBOARD_API_SECRET
 * Back-compat:   CONTENTFUL_REVALIDATE_SECRET (optional)
 */
export function hasValidSecret(req: Request): boolean {
  const hdr = new Headers(req.headers);
  const secret = hdr.get(SECRET_HEADER);
  const primary = process.env.DASHBOARD_API_SECRET || "";
  return Boolean(secret && (secret === primary));
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
