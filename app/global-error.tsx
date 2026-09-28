'use client';

import { useEffect } from 'react';

/**
 * Last-resort boundary: catches errors thrown by the root layout itself, so
 * it must render its own <html>/<body> and cannot rely on globals.css or the
 * font variables having loaded. Everything is inline on purpose.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html lang='en'>
      <body
        style={{
          margin: 0,
          fontFamily:
            'Geist, ui-sans-serif, system-ui, -apple-system, sans-serif',
          color: '#171717',
          background: '#fff',
        }}
      >
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 420, width: '100%' }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
              Something went wrong
            </h1>
            <p style={{ color: '#525252', fontSize: 14, marginTop: 8 }}>
              The page could not be rendered. Reloading usually fixes it.
            </p>
            {error.digest && (
              <p
                style={{
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  fontSize: 12,
                  color: '#737373',
                  marginTop: 16,
                }}
              >
                Reference: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                marginTop: 24,
                width: '100%',
                padding: '10px 16px',
                borderRadius: 6,
                border: 0,
                background: '#171717',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
