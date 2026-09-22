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
      <Navigation />
      <main className='flex-grow'>{children}</main>
      <Footer />
    </>
  );
}
