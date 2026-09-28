'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Error boundary for the public site. Renders inside the site layout, so the
 * navigation and footer stay in place; the digest lets a report be matched
 * to the server log entry.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Site Error]', error);
  }, [error]);

  return (
    <div className='flex min-h-[60vh] items-center justify-center p-4'>
      <div className='w-full max-w-md rounded-xl border border-neutral-200/60 bg-white p-8 shadow-sm'>
        <h1 className='text-xl font-semibold text-neutral-900'>
          This page couldn&apos;t load
        </h1>
        <p className='mt-2 text-sm text-neutral-600'>
          Something went wrong while loading it. Trying again usually fixes it.
        </p>
        {error.digest && (
          <p className='mt-4 font-mono text-xs text-neutral-500'>
            Reference: {error.digest}
          </p>
        )}
        <div className='mt-6 flex gap-3'>
          <button
            onClick={reset}
            className='flex-1 rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700'
          >
            Try again
          </button>
          <Link
            href='/'
            className='flex-1 rounded-md border border-neutral-300 px-4 py-2.5 text-center text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50'
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
