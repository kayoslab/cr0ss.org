import { getImageProps, type ImageProps } from 'next/image';
import { preload } from 'react-dom';
import {
  contentfulLoader,
  contentfulSrcSet,
} from '@/lib/contentful/image-loader';

/**
 * next/image semantics (lazy loading, priority preload, sizing) bound to
 * Contentful's Images API as a plain WebP <img>.
 *
 * Responsive images (`sizes` set) use the fixed width ladder in
 * lib/contentful/image-loader.ts rather than next.config's deviceSizes, so
 * every page requests the same few URLs and Contentful's CDN stays warm.
 * Fixed-width images (no `sizes`) keep next/image's 1x/2x pair.
 *
 * Accepts every next/image prop except `loader`. Renders on the server, so
 * server components can use it without crossing the client boundary.
 */
export function ContentfulImage(props: Omit<ImageProps, 'loader'>) {
  const { props: img } = getImageProps({ ...props, loader: contentfulLoader });

  if (img.sizes && typeof props.src === 'string') {
    const quality = props.quality === undefined ? undefined : +props.quality;
    Object.assign(img, contentfulSrcSet(props.src, quality));
  }

  // next/image only preloads from its client component; mirror it here.
  if (props.priority && img.srcSet) {
    preload(img.src, {
      as: 'image',
      imageSrcSet: img.srcSet,
      imageSizes: img.sizes,
      fetchPriority: 'high',
    });
  }

  // Props come from getImageProps with a custom loader: this is next/image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...img} />;
}
