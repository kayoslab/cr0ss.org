import type { Instrumentation } from 'next';

/**
 * Records every uncaught server error (render, route handler, server
 * action) as one structured log line. Vercel keeps console.error in the
 * runtime logs, and the digest here matches the one shown by error.tsx /
 * global-error.tsx, so a visitor's reference can be looked up.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  const err = error as Error & { digest?: string };
  console.error(
    JSON.stringify({
      level: 'error',
      kind: 'request-error',
      message: err.message,
      digest: err.digest,
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
      stack: err.stack,
    })
  );
};
