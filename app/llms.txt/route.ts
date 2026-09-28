import { buildLlmsIndex } from '@/lib/llms/content';

/**
 * /llms.txt — the llmstxt.org index. Next.js has no file convention for it
 * (unlike sitemap/robots), so it is a plain route handler, as Vercel's own
 * guidance does. Generated from Contentful, cached under the `content`
 * profile and refreshed by the Contentful webhook.
 */
export async function GET() {
  const body = await buildLlmsIndex();
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
