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
 */
export default function NotFound() {
  return <NotFoundContent />;
}
