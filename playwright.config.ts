import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke tests against a running site.
 *
 * - Locally: `pnpm build && pnpm e2e` starts `next start` on :3457 (not :3000,
 *   so it never collides with a running dev server).
 * - Against a deployment: `E2E_BASE_URL=https://... pnpm e2e` (for a
 *   protected preview, pass the bypass secret as E2E_BYPASS_TOKEN).
 */
const PORT = 3457;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    extraHTTPHeaders: process.env.E2E_BYPASS_TOKEN
      ? { 'x-vercel-protection-bypass': process.env.E2E_BYPASS_TOKEN }
      : {},
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm start -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
