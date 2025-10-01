import { SECRET_HEADER } from "@/lib/auth/constants";

export function getClientId(req: Request): string {
  const h = new Headers(req.headers);
  // Prefer the authenticated “user” (the secret holder)
  const secret = h.get(SECRET_HEADER);
  if (secret) return `secret:${hash(secret)}`;

  // Fallback: best-effort IP (behind proxies this is approximate)
  const ip =
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
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
