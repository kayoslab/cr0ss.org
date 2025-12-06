export const runtime = "edge";

import { revalidateTag as _revalidateTag, revalidatePath } from "next/cache";
import { hasValidSecret } from '@/lib/auth/secret';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/middleware';
import { getBlog } from '@/lib/contentful/api/blog';
import { algoliasearch } from 'algoliasearch';
import { env } from '@/env';
import type { CategoryProps } from '@/lib/contentful/api/props/category';
import type { BlogProps } from '@/lib/contentful/api/props/blog';

// Type-safe wrapper for revalidateTag that works in edge runtime
// Edge runtime doesn't support the second parameter properly despite TypeScript requiring it
const revalidateTag = (tag: string) => (_revalidateTag as (tag: string) => void)(tag);

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
 * Determines which cache tags to revalidate based on dashboard events
 */
function getDashboardRevalidationTags(event: DashboardEvent): string[] {
  const tags: string[] = [];
  const { event: eventType, date } = event;

  // Import cache tag helpers
  const { coffeeTags, workoutsTags, habitsTags, goalsTags } = require('@/lib/api/cache');

  switch (eventType) {
    case 'coffee.created':
      // Invalidate coffee summary for the specific date
      if (date) {
        tags.push(coffeeTags('summary', date));
      }
      // Also invalidate general coffee summary and timeline
      tags.push(coffeeTags('summary'));
      tags.push(coffeeTags('timeline'));
      tags.push(coffeeTags('caffeine-curve'));
      // Invalidate dashboard overview
      tags.push('dashboard');
      break;

    case 'workout.created':
      // Invalidate workout summary and heatmap
      if (date) {
        tags.push(workoutsTags('summary', date));
        tags.push(workoutsTags('heatmap', date));
      }
      tags.push(workoutsTags('summary'));
      tags.push(workoutsTags('heatmap'));
      tags.push(workoutsTags('running-stats'));
      // Invalidate dashboard overview
      tags.push('dashboard');
      break;

    case 'habits.updated':
      // Invalidate all habit-related data
      if (date) {
        tags.push(habitsTags('today', date));
      }
      tags.push(habitsTags('today'));
      tags.push(habitsTags('consistency'));
      tags.push(habitsTags('streaks'));
      tags.push(habitsTags('trends'));
      // Invalidate dashboard overview
      tags.push('dashboard');
      break;

    case 'goals.updated':
      // Invalidate goals data
      tags.push(goalsTags('list'));
      tags.push(goalsTags('progress'));
      // Invalidate dashboard overview
      tags.push('dashboard');
      break;

    default:
      console.warn(`Unknown dashboard event type: ${eventType}`);
  }

  return tags;
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

    const post = await getBlog(slug) as unknown as BlogProps;

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
  }

  return paths;
}

// Contentful's webhook will send a POST request to this endpoint to revalidate the cache
export async function POST(request: Request) {
  // Check for valid secret using standard auth
  if (!hasValidSecret(request)) {
    return createErrorResponse('Unauthorized', 401, undefined, 'UNAUTHORIZED');
  }

  try {
    const body = await request.json() as ContentfulWebhookPayload;

    const tagsToRevalidate = getRevalidationTags(body);
    const pathsToRevalidate = getRevalidationPaths(body);

    if (tagsToRevalidate.length === 0 && pathsToRevalidate.length === 0) {
      return createErrorResponse(
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
      revalidateTag(tag);
      console.log(`Revalidated tag: ${tag} at ${Date.now()}`);
    }

    // Update Algolia search index for blog posts
    let algoliaUpdated = false;
    if (contentTypeId === 'blogPost' && slug) {
      await updateAlgoliaIndex(slug);
      algoliaUpdated = true;
    }

    // Re-index content for AI chat
    // Note: This runs async and doesn't block the response
    let aiIndexed = false;
    if (contentTypeId === 'blogPost' && slug) {
      // Call the AI re-indexing endpoint (runs on Node runtime)
      fetch(new URL('/api/ai/reindex-blog', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-revalidation-key': request.headers.get('x-vercel-revalidation-key') || '',
        },
        body: JSON.stringify({ slug }),
      })
        .then(() => console.log(`AI re-indexing triggered for blog: ${slug}`))
        .catch((error) => console.error(`AI re-indexing failed for blog ${slug}:`, error));

      aiIndexed = true;
    }

    // Re-index knowledge base entry for AI chat
    if (contentTypeId === 'knowledgeBase' && slug) {
      fetch(new URL('/api/ai/reindex-knowledge', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-revalidation-key': request.headers.get('x-vercel-revalidation-key') || '',
        },
        body: JSON.stringify({ slug }),
      })
        .then(() => console.log(`AI re-indexing triggered for knowledge base: ${slug}`))
        .catch((error) => console.error(`AI re-indexing failed for knowledge base ${slug}:`, error));

      aiIndexed = true;
    }

    return createSuccessResponse({
      revalidated: true,
      tags: tagsToRevalidate,
      paths: pathsToRevalidate,
      algoliaIndexed: algoliaUpdated,
      aiIndexQueued: aiIndexed,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return createErrorResponse(
      'Failed to revalidate',
      500,
      error instanceof Error ? error.message : undefined,
      'REVALIDATION_ERROR'
    );
  }
}