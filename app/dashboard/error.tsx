'use client';

import { useEffect } from 'react';

/**
 * Error boundary for the dashboard segment. The message and stack go to the
 * runtime logs (already captured by Vercel); the visitor sees the digest so a
 * report can be matched to a log entry.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div className='flex min-h-[60vh] items-center justify-center p-4'>
      <div className='w-full max-w-md rounded-xl border border-neutral-200/60 bg-white p-8 shadow-sm'>
        <h1 className='text-xl font-semibold text-neutral-900'>
          The dashboard couldn&apos;t load
        </h1>
        <p className='mt-2 text-sm text-neutral-600'>
          Something went wrong while loading this page. Trying again usually
          fixes it.
        </p>
        {error.digest && (
          <p className='mt-4 font-mono text-xs text-neutral-500'>
            Reference: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className='mt-6 w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700'
        >
          Try again
        </button>
      </div>
    </div>
  );
}
