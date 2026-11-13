import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  // pnpm version comes from package.json's packageManager field (Corepack).
  framework: 'nextjs',
  redirects: [
    // www served every page as a 200 of its own: a second edge cache
    // (more cold misses) and duplicate URLs for crawlers.
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'www.cr0ss.org' }],
      destination: 'https://cr0ss.org/:path*',
      permanent: true,
    },
  ],
};
