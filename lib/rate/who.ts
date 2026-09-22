import { SECRET_HEADER } from "@/lib/auth/constants";

export function getClientId(req: Request): string {
  const h = new Headers(req.headers);
  // Prefer the authenticated “user” (the secret holder)
  const secret = h.get(SECRET_HEADER);
  if (secret) return `secret:${hash(secret)}`;

  // Fallback: client IP. Vercel sets x-real-ip from the connection itself;
  // x-forwarded-for's first hop is caller-controlled, so it's only a last resort.
  const ip =
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    "ip:unknown";

  return `ip:${ip}`;
}

// Stable non-cryptographic hash (to avoid logging raw secrets)
function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  // to base36 for compactness
  return Math.abs(h).toString(36);
}
