import type { ImageLoader, ImageLoaderProps } from 'next/image';

/** Contentful's Images API refuses dimensions above this. */
const CONTENTFUL_MAX_DIMENSION = 4000;

/**
 * The only widths requested for responsive Contentful images. Each distinct
 * URL is a separate entry in Contentful's CDN, and on a low-traffic site
 * most of them are cold: a miss costs 0.3–1.7 s before the first byte. A
 * short, shared ladder keeps the number of URLs per image small so they
 * stay warm. It covers a 400px card up to 3x density and the 1232px hero
 * at 2x.
 */
export const CONTENTFUL_WIDTHS = [480, 800, 1200, 1600, 2400] as const;

/**
 * next/image loader that lets Contentful's Images API produce every srcset
 * candidate directly, instead of Vercel re-encoding an image Contentful
 * already shrank. Always WebP: every supported browser decodes it, and a
 * second format would double the URLs per image (see CONTENTFUL_WIDTHS).
 *
 * `src` may carry preset params from `optimizeContentfulImage` (`fit`, `f`,
 * `w`, `h`). Width is replaced with the requested candidate and height, when
 * present, is scaled to keep the preset's aspect ratio so `fit=fill` crops
 * stay identical across candidates.
 */
export const contentfulLoader: ImageLoader = ({
  src,
  width,
  quality,
}: ImageLoaderProps): string => {
  const url = new URL(src.startsWith('//') ? `https:${src}` : src);
  const presetWidth = Number(url.searchParams.get('w')) || 0;
  const presetHeight = Number(url.searchParams.get('h')) || 0;
  const targetWidth = Math.min(width, CONTENTFUL_MAX_DIMENSION);

  url.searchParams.set('w', String(targetWidth));
  if (presetWidth && presetHeight) {
    url.searchParams.set(
      'h',
      String(Math.round((targetWidth * presetHeight) / presetWidth))
    );
  }
  url.searchParams.set('fm', 'webp');
  url.searchParams.set(
    'q',
    String(quality ?? (Number(url.searchParams.get('q')) || 75))
  );

  return url.toString();
};

/** A `srcset` over CONTENTFUL_WIDTHS, plus the largest candidate as `src`. */
export function contentfulSrcSet(
  src: string,
  quality?: number
): { src: string; srcSet: string } {
  const candidates = CONTENTFUL_WIDTHS.map((width) => ({
    width,
    url: contentfulLoader({ src, width, quality }),
  }));
  return {
    src: candidates[candidates.length - 1].url,
    srcSet: candidates.map(({ url, width }) => `${url} ${width}w`).join(', '),
  };
}
