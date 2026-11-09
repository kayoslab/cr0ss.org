import type { Metadata } from 'next';
import Navigation from '@/components/navigation';
import Footer from '@/components/footer';
import { NotFoundContent } from '@/components/not-found-content';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

/**
 * Root 404 for unmatched URLs. It renders under the root layout only, so it
 * brings the site chrome itself. `notFound()` thrown in a site route is
 * handled by app/(site)/not-found.tsx, inside the site layout's chrome.
 */
export default function NotFound() {
  return (
    <>
      <Navigation />
      <NotFoundContent />
      <Footer />
    </>
  );
}
