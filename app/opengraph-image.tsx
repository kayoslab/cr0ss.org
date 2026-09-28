import { ImageResponse } from 'next/og';
import { SITE_AUTHOR, SITE_NAME, SITE_URL } from '@/lib/constants';

/**
 * Default social preview for every page that does not supply its own
 * Open Graph image (home, list pages, dashboard). Blog posts, pages and
 * coffees set an image from their Contentful hero and override this.
 */
export const alt = `${SITE_NAME} by ${SITE_AUTHOR}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
        background: '#0a0a0a',
        color: '#fafafa',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -3 }}>
        {SITE_NAME}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontSize: 36,
          color: '#a3a3a3',
        }}
      >
        <div>{SITE_AUTHOR}</div>
        <div>{SITE_URL.replace('https://', '')}</div>
      </div>
    </div>,
    size
  );
}
