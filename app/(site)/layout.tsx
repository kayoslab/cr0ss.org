import Navigation from '@/components/navigation';
import Footer from '@/components/footer';

/**
 * Chrome for the public site (home, blog, coffee, portfolio, pages).
 * The dashboard lives in its own route segment with its own layout, so no
 * client-side pathname check is needed to decide what to render.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <a
        href='#main'
        className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg'
      >
        Skip to content
      </a>
      <Navigation />
      {/* Pages render their own <main>; this is only the skip-link target. */}
      <div id='main' className='flex-grow'>
        {children}
      </div>
      <Footer />
    </>
  );
}
