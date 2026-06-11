'use client';

import { usePathname } from 'next/navigation';
import Navigation from './navigation';
import Footer from './footer';

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard') ?? false;

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      <Navigation />
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  );
}
