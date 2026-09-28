import { renderMarkdown, type MarkdownKind } from '@/lib/llms/content';

/**
 * Markdown renditions of content pages.
 *
 * Public URLs are `/blog/<slug>.md`, `/page/<slug>.md` and
 * `/portfolio/<slug>.md`; a `[slug].md` route segment is not expressible in
 * the App Router, so next.config.mjs rewrites those onto `/llms/<kind>/<slug>`.
 */
const KINDS = new Set<MarkdownKind>(['blog', 'page', 'portfolio']);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const [kind, slug, ...rest] = path;
  if (!kind || !slug || rest.length > 0 || !KINDS.has(kind as MarkdownKind)) {
    return new Response('Not found', { status: 404 });
  }

  const markdown = await renderMarkdown(kind as MarkdownKind, slug);
  if (markdown === null) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control':
        'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
