/** @type {import('next').NextConfig} */
import { withWorkflow } from 'workflow/next';
import { fileURLToPath } from 'node:url';
import createJiti from 'jiti';
const jiti = createJiti(fileURLToPath(import.meta.url));
jiti('./env');

const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
    optimizePackageImports: ['@heroicons/react'],
  },
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
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

export default withWorkflow(nextConfig);