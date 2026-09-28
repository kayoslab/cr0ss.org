import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Geist, Geist_Mono } from 'next/font/google';
import {
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from '@/lib/constants';

// Vercel's Geist family, self-hosted by next/font. Exposed as CSS variables
// and wired to Tailwind's --font-sans / --font-mono in globals.css, so every
// element (body text, code, chart labels) inherits them without per-component
// font classes.
const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

// Site-wide defaults. Pages set a bare title and the template adds the
// suffix; relative URLs in child metadata resolve against metadataBase, and
// app/opengraph-image.tsx supplies the preview image where a page has none.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_AUTHOR, url: SITE_URL }],
  creator: SITE_AUTHOR,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    url: SITE_URL,
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = { colorScheme: 'light' };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className='flex min-h-screen flex-col font-sans antialiased'>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
