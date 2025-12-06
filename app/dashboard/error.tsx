'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Dashboard Error
        </h1>

        <div className="mb-6 space-y-4">
          <div>
            <h2 className="font-semibold text-lg mb-2">Error Details:</h2>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded font-mono text-sm overflow-auto">
              <p className="mb-2"><strong>Name:</strong> {error.name}</p>
              <p className="mb-2"><strong>Message:</strong> {error.message}</p>
              {error.digest && (
                <p className="mb-2"><strong>Digest:</strong> {error.digest}</p>
              )}
            </div>
          </div>

          {error.stack && (
            <div>
              <h2 className="font-semibold text-lg mb-2">Stack Trace:</h2>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded font-mono text-xs overflow-auto max-h-96">
                <pre className="whitespace-pre-wrap">{error.stack}</pre>
              </div>
            </div>
          )}

          <div>
            <h2 className="font-semibold text-lg mb-2">Debug Info:</h2>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded font-mono text-sm">
              <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
              <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
            </div>
          </div>
        </div>

        <button
          onClick={reset}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded transition-colors"
        >
          Try Again
        </button>

        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
          This error page is temporary for debugging on Vercel. Check the server logs for more details.
        </p>
      </div>
    </div>
  );
}
