/** @type {import('next').NextConfig} */
import { fileURLToPath } from 'node:url';
import createJiti from 'jiti';
const jiti = createJiti(fileURLToPath(import.meta.url));
jiti('./env');

const nextConfig = {
  transpilePackages: ['@tremor/react'],
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
    optimizePackageImports: ['@heroicons/react'],
  },
  reactStrictMode: true,
  compiler: {
    // Temporarily disable console removal for debugging Edge runtime on Vercel
    removeConsole: false, // process.env.NODE_ENV === 'production',
  },
  // Explicitly pass environment variables to Edge runtime
  env: {
    DASHBOARD_API_SECRET: process.env.DASHBOARD_API_SECRET,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
      },
    ],
    formats: ['image/avif', 'image/webp'],
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
        ],
      },
    ];
  },
};

export default nextConfig;