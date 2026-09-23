import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  // Pin pnpm to the version in package.json's packageManager field.
  installCommand: 'npx -y pnpm@10.34.2 install --frozen-lockfile',
  buildCommand: 'npx -y pnpm@10.34.2 run build',
  crons: [
    // Sweep for contacts whose enrichment workflow never started.
    { path: '/api/cron/enrich', schedule: '0 * * * *' },
  ],
};
