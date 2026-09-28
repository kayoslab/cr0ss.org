import { ContentfulImage } from '@/components/ui/contentful-image';
import { TrackedLink } from '@/components/blog/tracked-link';
import type { BlogProps } from '@/lib/contentful/api/props/blog';
import { optimizeWithPreset } from '@/lib/contentful/image-utils';

/**
 * The slice of a post a card needs. Cards used to receive the whole
 * BlogProps (rich-text body included), which was serialized into the RSC
 * payload of every page that shows them.
 */
export interface CardPost {
  id: string;
  slug: string;
  title: string;
  heroImageUrl?: string;
}

export function toCardPost(post: BlogProps): CardPost {
  return {
    id: post.sys.id,
    slug: post.slug,
    title: post.title,
    heroImageUrl: post.heroImage?.url,
  };
}

interface RecommendationCardProps {
  post: CardPost;
  /**
   * Load the image eagerly with high fetch priority, without a preload.
   * For the card that is the page's LCP on narrow viewports while another
   * element (the home avatar) is preloaded as the wide-viewport LCP.
   */
  eager?: boolean;
  /** Eager, high-priority and preloaded: the card is the page's only LCP. */
  priority?: boolean;
}

export function RecommendationCard({
  post,
  eager = false,
  priority = false,
}: RecommendationCardProps) {
  const href = `/blog/${post.slug}`;
  const optimizedImageUrl = optimizeWithPreset(post.heroImageUrl, 'gridThumbnail');

  return (
    <article className='flex h-full flex-col overflow-hidden rounded-lg shadow-lg'>
      <TrackedLink href={href} objectID={post.id}>
        <ContentfulImage
          alt={post.title}
          className='aspect-4/3 w-full object-cover'
          height={450}
          src={optimizedImageUrl}
          width={600}
          sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 400px'
          priority={priority}
          loading={eager || priority ? 'eager' : undefined}
          fetchPriority={eager || priority ? 'high' : undefined}
        />
      </TrackedLink>
      <div className='flex-1 p-6'>
        <TrackedLink href={href} objectID={post.id}>
          <h2 className='py-4 text-2xl leading-tight font-bold text-zinc-900'>
            {post.title}
          </h2>
        </TrackedLink>
        <div className='flex justify-end'>
          <TrackedLink
            className='inline-flex h-10 items-center justify-center text-sm font-medium'
            href={href}
            objectID={post.id}
          >
            Read More →
          </TrackedLink>
        </div>
      </div>
    </article>
  );
}
