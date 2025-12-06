export const runtime = 'nodejs';

/**
 * Debug endpoint to check environment variable access
 * This endpoint should be removed after debugging
 */
export async function GET(request: Request) {
  const secret = process.env.DASHBOARD_API_SECRET;
  const header = request.headers.get('x-admin-secret');

  console.log('[Debug Endpoint] Environment check:', {
    hasSecret: !!secret,
    secretLength: secret?.length || 0,
    secretFirst3: secret?.substring(0, 3),
    secretLast3: secret?.substring(secret.length - 3),
    hasHeader: !!header,
    headerLength: header?.length || 0,
    headerFirst3: header?.substring(0, 3),
    headerLast3: header?.substring(header.length - 3),
    match: secret === header,
    matchTrimmed: secret?.trim() === header?.trim(),
  });

  return new Response(
    JSON.stringify({
      hasSecret: !!secret,
      secretLength: secret?.length || 0,
      secretFirst3: secret?.substring(0, 3),
      secretLast3: secret?.substring(secret.length - 3),
      hasHeader: !!header,
      headerLength: header?.length || 0,
      headerFirst3: header?.substring(0, 3),
      headerLast3: header?.substring(header.length - 3),
      match: secret === header,
      matchTrimmed: secret?.trim() === header?.trim(),
      runtime: process.env.NEXT_RUNTIME || 'nodejs',
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }
  );
}
