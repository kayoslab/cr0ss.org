import { Metadata } from 'next';
import {
  SITE_NAME,
  SITE_URL,
  SITE_DESCRIPTION,
  SITE_AUTHOR,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
} from './constants';

/**
 * Ensures image URL is absolute and converts to social media compatible format
 * LinkedIn and other platforms don't support AVIF, so we convert to JPEG
 */
export function ensureAbsoluteUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  // Make URL absolute
  let absoluteUrl = url.startsWith('http') ? url : `https:${url}`;

  // Check if this is a Contentful image URL
  if (absoluteUrl.includes('ctfassets.net')) {
    // Convert AVIF to JPEG for better social media compatibility
    // LinkedIn doesn't support AVIF images for Open Graph previews
    if (absoluteUrl.endsWith('.avif') || absoluteUrl.includes('fm=avif')) {
      // Parse URL to add/modify query parameters
      const urlObj = new URL(absoluteUrl);

      // Set format to JPEG and quality for optimal social sharing
      urlObj.searchParams.set('fm', 'jpg');
      urlObj.searchParams.set('q', '85');

      // Ensure proper dimensions for Open Graph
      if (!urlObj.searchParams.has('w')) {
        urlObj.searchParams.set('w', String(OG_IMAGE_WIDTH));
      }

      absoluteUrl = urlObj.toString();
    }
  }

  return absoluteUrl;
}

/**
 * Creates metadata for blog posts
 */
export function createBlogMetadata({
  title,
  description,
  keywords,
  author,
  slug,
  publishedTime,
  modifiedTime,
  heroImageUrl,
  category,
}: {
  title: string;
  description: string;
  keywords?: string[];
  author: string;
  slug: string;
  publishedTime: string;
  modifiedTime?: string;
  heroImageUrl?: string | null;
  category?: string;
}): Metadata {
  const absoluteImageUrl = ensureAbsoluteUrl(heroImageUrl);
  const url = `${SITE_URL}/blog/${slug}`;

  return {
    title,
    description,
    keywords,
    authors: [{ name: author }],
    openGraph: {
      type: 'article',
      title,
      description,
      siteName: SITE_NAME,
      url,
      images:
        absoluteImageUrl !== null
          ? [
              {
                url: absoluteImageUrl,
                width: OG_IMAGE_WIDTH,
                height: OG_IMAGE_HEIGHT,
                alt: title,
              },
            ]
          : [],
      publishedTime,
      ...(modifiedTime && { modifiedTime }),
      authors: [author],
      section: category,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: absoluteImageUrl !== null ? [absoluteImageUrl] : undefined,
      creator: author,
    },
    alternates: {
      canonical: url,
    },
    creator: author,
    publisher: SITE_AUTHOR,
    robots: {
      index: true,
      follow: true,
      nocache: true,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Creates metadata for pages
 */
export function createPageMetadata({
  title,
  description,
  slug,
  heroImageUrl,
}: {
  title: string;
  description?: string;
  slug: string;
  heroImageUrl?: string | null;
}): Metadata {
  const absoluteImageUrl = ensureAbsoluteUrl(heroImageUrl);
  const url = `${SITE_URL}/page/${slug}`;

  return {
    title,
    description: description || SITE_DESCRIPTION,
    authors: [{ name: SITE_AUTHOR }],
    openGraph: {
      type: 'website',
      title,
      description: description || SITE_DESCRIPTION,
      siteName: SITE_NAME,
      url,
      images:
        absoluteImageUrl !== null
          ? [
              {
                url: absoluteImageUrl,
                width: OG_IMAGE_WIDTH,
                height: OG_IMAGE_HEIGHT,
                alt: title,
              },
            ]
          : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description || SITE_DESCRIPTION,
      images: absoluteImageUrl !== null ? [absoluteImageUrl] : undefined,
    },
    alternates: {
      canonical: url,
    },
    publisher: SITE_AUTHOR,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Creates metadata for list pages (blog index, categories, search)
 */
export function createListMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      siteName: SITE_NAME,
      url,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}

/**
 * Creates JSON-LD structured data for blog articles
 */
export function createBlogJsonLd({
  title,
  description,
  author,
  slug,
  publishedTime,
  modifiedTime,
  heroImageUrl,
}: {
  title: string;
  description: string;
  author: string;
  slug: string;
  publishedTime: string;
  modifiedTime?: string;
  heroImageUrl?: string | null;
}) {
  const absoluteImageUrl = ensureAbsoluteUrl(heroImageUrl);
  const url = `${SITE_URL}/blog/${slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    image: absoluteImageUrl !== null ? absoluteImageUrl : undefined,
    datePublished: publishedTime,
    ...(modifiedTime && { dateModified: modifiedTime }),
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Person',
      name: SITE_AUTHOR,
    },
    url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

/**
 * Creates breadcrumb JSON-LD for blog posts
 */
export function createBlogBreadcrumbJsonLd({
  slug,
  title,
  category,
}: {
  slug: string;
  title: string;
  category?: string;
}) {
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Blog',
      item: `${SITE_URL}/blog`,
    },
  ];

  if (category) {
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: category,
      item: `${SITE_URL}/blog/category/${category.toLowerCase().replace(/\s+/g, '-')}`,
    });
    items.push({
      '@type': 'ListItem',
      position: 4,
      name: title,
      item: `${SITE_URL}/blog/${slug}`,
    });
  } else {
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: title,
      item: `${SITE_URL}/blog/${slug}`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

/**
 * Creates breadcrumb JSON-LD for coffee pages
 */
export function createCoffeeBreadcrumbJsonLd({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Coffee Collection',
        item: `${SITE_URL}/coffee`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name,
        item: `${SITE_URL}/coffee/${slug}`,
      },
    ],
  };
}
