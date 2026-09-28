import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  // pnpm version comes from package.json's packageManager field (Corepack).
  framework: 'nextjs',
  crons: [
    // Sweep for contacts whose enrichment workflow never started.
    { path: '/api/cron/enrich', schedule: '0 * * * *' },
  ],
};
