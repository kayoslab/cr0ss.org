import type { ImageLoader, ImageLoaderProps } from 'next/image';

/** Contentful's Images API refuses dimensions above this. */
const CONTENTFUL_MAX_DIMENSION = 4000;

export type ContentfulFormat = 'avif' | 'webp';

/**
 * Builds a next/image loader that lets Contentful's Images API produce every
 * srcset candidate directly, instead of Vercel re-encoding an image
 * Contentful already shrank.
 *
 * - One lossy encode (source → target format) rather than two.
 * - Each `w` in the srcset is real: the browser gets the pixels it asked for.
 * - No Vercel image transformations for Contentful assets.
 *
 * Contentful does not negotiate formats from the Accept header, so the
 * format is fixed per loader and <ContentfulImage> pairs an AVIF and a WebP
 * loader inside a <picture> to let the browser choose.
 *
 * `src` may carry preset params from `optimizeContentfulImage` (`fit`, `f`,
 * `w`, `h`). Width is replaced with the requested candidate and height, when
 * present, is scaled to keep the preset's aspect ratio so `fit=fill` crops
 * stay identical across candidates.
 */
export function contentfulLoaderFor(format: ContentfulFormat): ImageLoader {
  return ({ src, width, quality }: ImageLoaderProps): string => {
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
    url.searchParams.set('fm', format);
    url.searchParams.set(
      'q',
      String(quality ?? (Number(url.searchParams.get('q')) || 75))
    );

    return url.toString();
  };
}
