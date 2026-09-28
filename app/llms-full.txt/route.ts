import { buildLlmsFull } from '@/lib/llms/content';

/** /llms-full.txt — every page's Markdown in one document. */
export async function GET() {
  const body = await buildLlmsFull();
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
