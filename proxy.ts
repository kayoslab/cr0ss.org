import { NextResponse, type NextRequest } from 'next/server';

/**
 * Legacy pagination URLs (`/blog?page=2`) → path-based (`/blog/page/2`).
 * A next.config redirect would carry the query along; this strips it.
 * Only the three list routes are matched, so nothing else pays for it.
 */
export function proxy(request: NextRequest) {
  const page = request.nextUrl.searchParams.get('page');
  if (page === null) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.searchParams.delete('page');
  if (/^\d+$/.test(page) && Number(page) > 1) {
    url.pathname = `${url.pathname}/page/${Number(page)}`;
  }
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ['/blog', '/coffee', '/blog/category/:slug'],
};
