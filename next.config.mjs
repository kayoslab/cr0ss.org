/** @type {import('next').NextConfig} */
import { withWorkflow } from 'workflow/next';
import { fileURLToPath } from 'node:url';
import createJiti from 'jiti';
const jiti = createJiti(fileURLToPath(import.meta.url));
jiti('./env');

const nextConfig = {
  // Cache Components: dynamic by default, `'use cache'` opts data into the
  // cache. Profiles below are referenced by name via cacheLife() — see
  // lib/cache/tags.ts for which data uses which.
  cacheComponents: true,
  // Links prefetch one reusable shell per route instead of a full payload per link.
  partialPrefetching: true,
  cacheLife: {
    // Live-ish dashboard numbers (today's cups, today's habits).
    realtime: { stale: 60, revalidate: 60, expire: 86400 },
    // Charts over recent days.
    frequent: { stale: 300, revalidate: 300, expire: 86400 },
    // Expensive analysis (correlations).
    standard: { stale: 900, revalidate: 900, expire: 86400 },
    // Reference data: countries, coffee catalogue, Algolia recommendations.
    stable: { stale: 3600, revalidate: 3600, expire: 604800 },
    // Contentful content: invalidated by webhook, refreshed hourly as a backstop.
    content: { stale: 3600, revalidate: 3600, expire: 604800 },
  },
  experimental: {
    // Tailwind's sheet is ~17 KB: inlining it removes a render-blocking request.
    inlineCss: true,
    serverActions: { bodySizeLimit: '2mb' },
    optimizePackageImports: ['@heroicons/react'],
  },
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    // Contentful assets use lib/contentful/image-loader.ts, so the Vercel
    // optimizer only ever sees local files (the home avatar).
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // Content is capped at max-w-7xl (1280 CSS px); 2560 covers it at 2x.
    // Anything wider is a cache-fragmenting transformation that no layout
    // can select.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: `frame-ancestors 'self' https://app.contentful.com`,
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
        ],
      },
    ];
  },
};

export default withWorkflow(nextConfig);
