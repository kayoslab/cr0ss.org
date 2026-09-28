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
  // The Tailwind sheet is ~90 KB (dashboard, charts, sidebar); it is served
  // as one immutable file rather than inlined (experimental.inlineCss), which
  // embedded three copies in every HTML response.
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    // Keep error/warn: they are the only signal in Vercel's runtime logs.
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
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
  async rewrites() {
    // Markdown renditions for agents: /blog/<slug>.md etc. A `[slug].md`
    // segment is not expressible in the App Router, so map onto the
    // catch-all handler in app/llms/[...path]/route.ts.
    return [
      { source: '/blog/:slug.md', destination: '/llms/blog/:slug' },
      { source: '/page/:slug.md', destination: '/llms/page/:slug' },
      { source: '/portfolio/:slug.md', destination: '/llms/portfolio/:slug' },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // frame-ancestors supersedes X-Frame-Options and, unlike it, can
          // allow the Contentful preview iframe.
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
