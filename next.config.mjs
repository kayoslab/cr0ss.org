/** @type {import('next').NextConfig} */
import { fileURLToPath } from 'node:url';
import createJiti from 'jiti';
const jiti = createJiti(fileURLToPath(import.meta.url));
jiti('./env');

const nextConfig = {
  transpilePackages: ['@tremor/react'],
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  reactStrictMode: true,
  // Turbopack configuration for Transformers.js on Vercel serverless
  // onnxruntime-node has native binaries that don't work on serverless
  // We alias it to onnxruntime-web which uses WASM instead
  turbopack: {
    resolveAlias: {
      'onnxruntime-node': 'onnxruntime-web',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
      },
    ],
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