import { revalidateTag, revalidatePath } from 'next/cache';
import { hasValidSecret } from '@/lib/auth/secret';
import { apiError, apiSuccess } from '@/lib/api/responses';
import { getBlog } from '@/lib/contentful/api/blog';
import { algoliasearch } from 'algoliasearch';
import { env } from '@/env';
import { invalidations } from '@/lib/cache/tags';
import type { CategoryProps } from '@/lib/contentful/api/props/category';
import type { BlogProps } from '@/lib/contentful/api/props/blog';

/**
 * Contentful webhook payload structure
 */
interface ContentfulWebhookPayload {
  sys?: {
    type?: string;
    id?: string;
    contentType?: {
      sys?: {
        id?: string;
      };
    };
  };
  fields?: {
    slug?: {
      'en-US'?: string;
    };
  };
  // Legacy format support
  tag?: string;
  path?: string;
  // Dashboard event-based invalidation
  dashboard?: DashboardEvent;
}

/**
 * Dashboard event structure for event-based cache invalidation
 */
interface DashboardEvent {
  /** Event type (e.g., 'coffee.created', 'workout.created', 'habits.updated', 'goals.updated') */
  event: string;
  /** Optional date parameter for date-specific invalidation (YYYY-MM-DD format) */
  date?: string;
  /** Optional additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Maps a dashboard event onto the registry's invalidation set for it.
 * Dates are ignored on purpose: invalidation targets the general tags.
 */
const DASHBOARD_EVENTS: Record<string, readonly string[]> = {
  'coffee.created': invalidations.coffee,
  'workout.created': invalidations.workouts,
  'habits.updated': invalidations.habits,
  'goals.updated': invalidations.goals,
};

function getDashboardRevalidationTags(event: DashboardEvent): string[] {
  const tags = DASHBOARD_EVENTS[event.event];
  if (!tags) {
    console.warn(`Unknown dashboard event type: ${event.event}`);
    return [];
  }
  return [...tags];
}

/**
 * Determines which cache tags to revalidate based on Contentful content type
 */
function getRevalidationTags(payload: ContentfulWebhookPayload): string[] {
  const tags: string[] = [];

  // Handle dashboard events first
  if (payload.dashboard) {
    tags.push(...getDashboardRevalidationTags(payload.dashboard));
  }

  // Handle legacy format (manual tag/path specification)
  if (payload.tag) {
    tags.push(payload.tag);
  }

  // Handle Contentful webhook format
  const contentTypeId = payload.sys?.contentType?.sys?.id;
  const slug = payload.fields?.slug?.['en-US'];

  if (!contentTypeId) {
    return tags;
  }

  switch (contentTypeId) {
    case 'blogPost':
      // Revalidate general blog collection
      tags.push('blogPosts');

      // Revalidate specific blog post if slug is available
      if (slug) {
        tags.push(slug);
      }
      break;

    case 'page':
      // Revalidate general pages collection
      tags.push('pages');

      // Revalidate specific page if slug is available
      if (slug) {
        tags.push(slug);
      }
      break;

    case 'country':
      // Revalidate all country-related data
      tags.push('countries');
      break;

    case 'coffee':
      // Revalidate coffee collection
      tags.push('coffee');

      // Revalidate specific coffee entry if slug is available
      if (slug) {
        tags.push(slug);
      }
      break;

    case 'knowledgeBase':
      // Revalidate knowledge base collection
      tags.push('knowledgeBase');
      break;

    case 'portfolioProject':
      // Revalidate portfolio collection
      tags.push('portfolioProjects');

      // Revalidate specific project if slug is available
      if (slug) {
        tags.push(slug);
      }
      break;

    default:
      console.warn(`Unknown content type: ${contentTypeId}`);
  }

  return tags;
}

/**
 * Updates Algolia search index for a blog post
 */
async function updateAlgoliaIndex(slug: string): Promise<void> {
  try {
    const algoliaClient = algoliasearch(
      env.ALGOLIA_APP_ID,
      env.ALGOLIA_ADMIN_KEY
    );

    const post = (await getBlog(slug)) as unknown as BlogProps;

    await algoliaClient.addOrUpdateObject({
      indexName: env.ALGOLIA_INDEX,
      objectID: post.sys.id,
      body: {
        url: `/blog/${post.slug}/`,
        title: post.title,
        summary: post.summary,
        author: post.author,
        categories: post.categoriesCollection.items
          .map((category: CategoryProps) => category.title)
          .join(','),
        image: post.heroImage?.url,
        objectID: post.sys.id,
      },
    });

    console.log(`Updated Algolia index for: ${slug} at ${Date.now()}`);
  } catch (error) {
    console.error(`Failed to update Algolia index for ${slug}:`, error);
    // Don't throw - we don't want Algolia failures to prevent cache revalidation
  }
}

/**
 * Determines which paths to revalidate based on content type
 */
function getRevalidationPaths(payload: ContentfulWebhookPayload): string[] {
  const paths: string[] = [];

  // Handle legacy format
  if (payload.path) {
    paths.push(payload.path);
  }

  const contentTypeId = payload.sys?.contentType?.sys?.id;
  const slug = payload.fields?.slug?.['en-US'];

  if (!contentTypeId) {
    return paths;
  }

  switch (contentTypeId) {
    case 'blogPost':
      // Revalidate blog index
      paths.push('/blog');

      // Revalidate specific blog post if slug is available
      if (slug) {
        paths.push(`/blog/${slug}`);
      }
      break;

    case 'page':
      // Revalidate specific page if slug is available
      if (slug) {
        paths.push(`/page/${slug}`);
      }
      break;

    case 'country':
      // Revalidate home page (might show country data)
      paths.push('/');
      break;

    case 'coffee':
      // Revalidate coffee list page
      paths.push('/coffee');

      // Revalidate dashboard if it shows coffee data
      paths.push('/dashboard');

      // Revalidate specific coffee detail page if slug is available
      if (slug) {
        paths.push(`/coffee/${slug}`);
      }
      break;

    case 'portfolioProject':
      // Revalidate portfolio index
      paths.push('/portfolio');

      // Revalidate specific project detail page if slug is available
      if (slug) {
        paths.push(`/portfolio/${slug}`);
      }
      break;
  }

  return paths;
}

// Contentful's webhook will send a POST request to this endpoint to revalidate the cache
export async function POST(request: Request) {
  // Check for valid secret using standard auth
  if (!hasValidSecret(request)) {
    return apiError('Unauthorized', 401, undefined, 'UNAUTHORIZED');
  }

  try {
    const body = (await request.json()) as ContentfulWebhookPayload;

    const tagsToRevalidate = getRevalidationTags(body);
    const pathsToRevalidate = getRevalidationPaths(body);

    if (tagsToRevalidate.length === 0 && pathsToRevalidate.length === 0) {
      return apiError(
        'No revalidation targets determined from payload',
        400,
        { payload: body },
        'MISSING_TARGETS'
      );
    }

    // Extract content type and slug for Algolia indexing
    const contentTypeId = body.sys?.contentType?.sys?.id;
    const slug = body.fields?.slug?.['en-US'];

    // Revalidate all determined paths
    for (const path of pathsToRevalidate) {
      revalidatePath(path);
      console.log(`Revalidated path: ${path} at ${Date.now()}`);
    }

    // Revalidate all determined tags
    for (const tag of tagsToRevalidate) {
      revalidateTag(tag, 'max');
      console.log(`Revalidated tag: ${tag} at ${Date.now()}`);
    }

    // Update Algolia search index for blog posts
    let algoliaUpdated = false;
    if (contentTypeId === 'blogPost' && slug) {
      await updateAlgoliaIndex(slug);
      algoliaUpdated = true;
    }

    return apiSuccess({
      revalidated: true,
      tags: tagsToRevalidate,
      paths: pathsToRevalidate,
      algoliaIndexed: algoliaUpdated,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return apiError(
      'Failed to revalidate',
      500,
      error instanceof Error ? error.message : undefined,
      'REVALIDATION_ERROR'
    );
  }
}
