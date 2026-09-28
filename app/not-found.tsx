import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/navigation';
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: 'Page not found | cr0ss.mind',
  robots: { index: false, follow: false },
};

/**
 * Root 404: serves unmatched URLs and every `notFound()` thrown in the site
 * routes. It renders under the root layout only, so it brings the site chrome
 * itself to match the rest of the public pages.
 */
export default function NotFound() {
  return (
    <>
      <Navigation />
      <main className='flex flex-grow items-center justify-center px-4 py-24'>
        <div className='max-w-md text-center'>
          <p className='font-mono text-sm text-neutral-500'>404</p>
          <h1 className='mt-2 text-3xl font-bold tracking-tight text-neutral-900'>
            Page not found
          </h1>
          <p className='mt-4 text-neutral-600'>
            The page you are looking for does not exist or has moved.
          </p>
          <div className='mt-8 flex justify-center gap-3'>
            <Link
              href='/'
              className='rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700'
            >
              Go home
            </Link>
            <Link
              href='/blog'
              className='rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50'
            >
              Read the blog
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
