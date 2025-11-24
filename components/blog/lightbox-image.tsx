'use client';

import Image from 'next/image';
import { Lightbox } from '@/components/ui/lightbox';
import { optimizeWithPreset } from '@/lib/contentful/image-utils';

interface LightboxImageProps {
  src: string;
  alt: string;
}

/**
 * A client component that wraps an image with lightbox functionality
 * Used for embedded images in rich text content
 */
export function LightboxImage({ src, alt }: LightboxImageProps) {
  return (
    <Lightbox src={src} alt={alt}>
      <Image
        src={optimizeWithPreset(src, 'embedded')}
        alt={alt}
        width={0}
        height={0}
        sizes="(max-width: 900px) 100vw, 900px"
        style={{ width: '100%', height: 'auto' }}
        className="rounded-lg"
      />
    </Lightbox>
  );
}
