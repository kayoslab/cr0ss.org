/**
 * Contentful Image Optimization Utilities
 *
 * Provides consistent image optimization using Contentful's Image API
 * for better performance and Vercel caching.
 */

export interface ContentfulImageOptions {
  /** Image width in pixels */
  width?: number;
  /** Image height in pixels */
  height?: number;
  /** Image quality (1-100), defaults to 80 */
  quality?: number;
  /** Fit mode for resizing */
  fit?: 'pad' | 'fill' | 'scale' | 'crop' | 'thumb';
  /** Focus area for cropping */
  focus?: 'center' | 'top' | 'right' | 'left' | 'bottom' | 'face' | 'faces';
  /** Output format */
  format?: 'webp' | 'jpg' | 'png' | 'gif' | 'avif';
}

/**
 * Optimizes a Contentful image URL with the specified parameters.
 * Uses Contentful's Image API for server-side transformations.
 *
 * @param url - The original Contentful image URL
 * @param options - Optimization options
 * @returns Optimized URL with query parameters
 *
 * @example
 * // Hero image (full width, high quality)
 * optimizeContentfulImage(url, { width: 1200, quality: 85, format: 'webp' })
 *
 * // Grid thumbnail (fixed dimensions)
 * optimizeContentfulImage(url, { width: 700, height: 526, fit: 'fill', quality: 80, format: 'webp' })
 */
export function optimizeContentfulImage(
  url: string | undefined | null,
  options: ContentfulImageOptions = {}
): string {
  if (!url) return '';

  const {
    width,
    height,
    quality = 80,
    fit,
    focus,
    format = 'webp',
  } = options;

  const params = new URLSearchParams();

  if (width) params.set('w', String(width));
  if (height) params.set('h', String(height));
  if (fit) params.set('fit', fit);
  if (focus) params.set('f', focus);
  if (format) params.set('fm', format);
  if (quality) params.set('q', String(quality));

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Preset configurations for common image use cases
 */
export const imagePresets = {
  /** Hero image for blog articles and pages (full width, high quality) */
  hero: {
    width: 1200,
    quality: 85,
    format: 'webp' as const,
  },

  /** Grid/card thumbnails (4:3 aspect ratio)
   * Sized for 3-column grid (max ~427px per column)
   * 600px width covers 2x retina displays at ~85% efficiency
   */
  gridThumbnail: {
    width: 600,
    height: 450,
    fit: 'fill' as const,
    quality: 75,
    format: 'webp' as const,
  },

  /** Embedded content images in rich text */
  embedded: {
    width: 1000,
    quality: 85,
    format: 'webp' as const,
  },

  /** Small preview images */
  preview: {
    width: 400,
    height: 300,
    fit: 'fill' as const,
    quality: 75,
    format: 'webp' as const,
  },

  /** Tiny thumbnail for search suggestions */
  searchThumbnail: {
    width: 80,
    height: 60,
    fit: 'fill' as const,
    quality: 70,
    format: 'webp' as const,
  },
} as const;

/**
 * Convenience function using preset configurations
 */
export function optimizeWithPreset(
  url: string | undefined | null,
  preset: keyof typeof imagePresets
): string {
  return optimizeContentfulImage(url, imagePresets[preset]);
}
