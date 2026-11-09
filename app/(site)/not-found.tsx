import type { Metadata } from 'next';
import { NotFoundContent } from '@/components/not-found-content';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

/**
 * 404 for `notFound()` thrown in a site route. It renders inside the site
 * layout, which already provides the header and footer; the root
 * app/not-found.tsx (which brings its own) previously ended up nested in
 * that layout and showed both twice.
 *
 * These responses keep status 200: with Cache Components the prerendered
 * shell is sent before the page can call notFound(), and dynamicParams is
 * unavailable. Next adds <meta name="robots" content="noindex">, so they
 * are never indexed. A real 404 would need a proxy.ts slug check in front
 * of the CDN cache on every post view; that cost was removed in 44cf144
 * and is deliberately not reintroduced.
 */
export default function NotFound() {
  return <NotFoundContent />;
}
