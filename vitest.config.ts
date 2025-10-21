import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'lib/contentful/setup.ts',
        '.next/',
        'out/',
        'public/',
        '**/*.stories.*',
        '**/*.spec.*',
        '**/*.test.*',
      ],
      thresholds: {
        // Global thresholds disabled - we use per-file thresholds instead
        // to avoid failing CI on untested files while maintaining high
        // coverage requirements for files that have tests
        autoUpdate: false,

        // Per-file thresholds for tested modules
        'lib/phys/caffeine.tsx': {
          branches: 80,
          functions: 100,
          lines: 100,
          statements: 100,
        },
        'lib/time/berlin.tsx': {
          branches: 82,
          functions: 90,
          lines: 94,
          statements: 94,
        },
        'lib/map/centroid.ts': {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60,
        },
        'lib/validation.tsx': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'app/api/auth/check/route.ts': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        'app/api/location/route.ts': {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
