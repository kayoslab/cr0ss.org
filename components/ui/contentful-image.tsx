import { getImageProps, type ImageProps } from 'next/image';
import { preload } from 'react-dom';
import { contentfulLoaderFor } from '@/lib/contentful/image-loader';

const avifLoader = contentfulLoaderFor('avif');
const webpLoader = contentfulLoaderFor('webp');

/**
 * next/image semantics (srcset from `sizes`, lazy loading, priority preload)
 * bound to Contentful's Images API, rendered as a <picture> so the browser
 * negotiates the format itself: AVIF where supported, WebP everywhere else.
 * Contentful cannot negotiate from the Accept header, so a bare <img> would
 * hand AVIF-less browsers a broken image.
 *
 * Accepts every next/image prop except `loader`. Renders on the server, so
 * server components can use it without crossing the client boundary.
 */
export function ContentfulImage(props: Omit<ImageProps, 'loader'>) {
  const { props: avif } = getImageProps({ ...props, loader: avifLoader });
  const { props: img } = getImageProps({ ...props, loader: webpLoader });

  // next/image only preloads from its client component; mirror it here for
  // the AVIF candidates. Browsers that can't decode AVIF skip a typed preload
  // and simply fetch the WebP the <picture> resolves to.
  if (props.priority && avif.srcSet) {
    preload(avif.src, {
      as: 'image',
      type: 'image/avif',
      imageSrcSet: avif.srcSet,
      imageSizes: avif.sizes,
      fetchPriority: 'high',
    });
  }

  return (
    // display: contents keeps <picture> out of the layout so the img's
    // width/aspect classes resolve exactly as they did on a bare <img>.
    <picture className='contents'>
      <source type='image/avif' srcSet={avif.srcSet} sizes={avif.sizes} />
      <img {...img} />
    </picture>
  );
}
