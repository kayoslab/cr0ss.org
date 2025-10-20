# Cache Revalidation & Search Indexing API

## Overview

The `/api/revalidate` endpoint handles both cache invalidation AND search index updates for Contentful content via webhooks. When a blog post is published, this single endpoint will:

1. **Revalidate caches** - Clear Next.js cache tags and paths
2. **Update Algolia** - Automatically index the blog post for search (blog posts only)

## Endpoint

```
POST https://cr0ssorg-kayoslabs.vercel.app/api/revalidate
```

## Authentication

The endpoint requires authentication via the Contentful webhook header:

```
x-vercel-revalidation-key: <CONTENTFUL_REVALIDATE_SECRET>
```

This single secret is used for all Contentful webhook operations (cache revalidation + search indexing).

## Content Types

### Blog Posts (`blogPost`)

**Cache Tags Revalidated:**
- `blogPosts` - General blog collection
- `{slug}` - Specific blog post (if slug available)

**Paths Revalidated:**
- `/blog` - Blog index page
- `/blog/{slug}` - Specific blog post page

**Example Webhook Payload:**
```json
{
  "sys": {
    "contentType": {
      "sys": {
        "id": "blogPost"
      }
    }
  },
  "fields": {
    "slug": {
      "en-US": "my-blog-post"
    }
  }
}
```

**Example Response:**
```json
{
  "revalidated": true,
  "tags": ["blogPosts", "my-blog-post"],
  "paths": ["/blog", "/blog/my-blog-post"],
  "algoliaIndexed": true,
  "timestamp": 1234567890123
}
```

**Note:** `algoliaIndexed: true` indicates the blog post was also indexed in Algolia for search.

---

### Pages (`page`)

**Cache Tags Revalidated:**
- `pages` - General pages collection
- `{slug}` - Specific page (if slug available)

**Paths Revalidated:**
- `/page/{slug}` - Specific page

**Example Webhook Payload:**
```json
{
  "sys": {
    "contentType": {
      "sys": {
        "id": "page"
      }
    }
  },
  "fields": {
    "slug": {
      "en-US": "about"
    }
  }
}
```

**Example Response:**
```json
{
  "revalidated": true,
  "tags": ["pages", "about"],
  "paths": ["/page/about"],
  "algoliaIndexed": false,
  "timestamp": 1234567890123
}
```

**Note:** Pages are not indexed in Algolia, so `algoliaIndexed: false`.

---

### Countries (`country`)

**Cache Tags Revalidated:**
- `countries` - All country-related data

**Paths Revalidated:**
- `/` - Home page (may display country data)

**Example Webhook Payload:**
```json
{
  "sys": {
    "contentType": {
      "sys": {
        "id": "country"
      }
    }
  }
}
```

**Example Response:**
```json
{
  "revalidated": true,
  "tags": ["countries"],
  "paths": ["/"],
  "algoliaIndexed": false,
  "timestamp": 1234567890123
}
```

---

### Coffee (`coffee`)

**Cache Tags Revalidated:**
- `coffee` - Coffee collection

**Paths Revalidated:**
- `/dashboard` - Dashboard page (displays coffee data)

**Example Webhook Payload:**
```json
{
  "sys": {
    "contentType": {
      "sys": {
        "id": "coffee"
      }
    }
  }
}
```

**Example Response:**
```json
{
  "revalidated": true,
  "tags": ["coffee"],
  "paths": ["/dashboard"],
  "algoliaIndexed": false,
  "timestamp": 1234567890123
}
```

---

## Legacy Format

The endpoint also supports a legacy manual format:

**Request:**
```json
{
  "tag": "blogPosts",
  "path": "/blog"
}
```

**Response:**
```json
{
  "revalidated": true,
  "tags": ["blogPosts"],
  "paths": ["/blog"],
  "algoliaIndexed": false,
  "timestamp": 1234567890123
}
```

**Note:** Legacy format doesn't include slug, so Algolia indexing is skipped.

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

### 400 Missing Targets
```json
{
  "error": "No revalidation targets determined from payload",
  "details": { "payload": {...} },
  "code": "MISSING_TARGETS"
}
```

### 500 Server Error
```json
{
  "error": "Failed to revalidate",
  "details": "Error message",
  "code": "REVALIDATION_ERROR"
}
```

---

## Contentful Webhook Setup

1. Go to **Settings → Webhooks** in your Contentful space
2. Create a new webhook
3. Set the URL to: `https://cr0ssorg-kayoslabs.vercel.app/api/revalidate`
4. Add custom header:
   - Name: `x-vercel-revalidation-key`
   - Value: Your `CONTENTFUL_REVALIDATE_SECRET`
5. Select triggers:
   - Entry: **Publish** and **Unpublish**
   - Asset: **Publish** and **Unpublish** (optional)
6. Save the webhook

---

## Testing

### Using curl

```bash
curl -X POST https://cr0ssorg-kayoslabs.vercel.app/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-vercel-revalidation-key: YOUR_SECRET" \
  -d '{
    "sys": {
      "contentType": {
        "sys": {
          "id": "blogPost"
        }
      }
    },
    "fields": {
      "slug": {
        "en-US": "test-post"
      }
    }
  }'
```

### Expected Success Response

```json
{
  "revalidated": true,
  "tags": ["blogPosts", "test-post"],
  "paths": ["/blog", "/blog/test-post"],
  "algoliaIndexed": true,
  "timestamp": 1234567890123
}
```

The response indicates:
- ✅ Cache tags and paths were revalidated
- ✅ Blog post was indexed in Algolia for search

---

## Implementation Details

### Cache Tag Strategy

The endpoint uses Next.js's built-in cache tagging system:

- **Collection tags**: Invalidate entire collections (e.g., `blogPosts`, `pages`)
- **Slug-based tags**: Invalidate specific items (e.g., `my-blog-post`)
- **Type-based tags**: Invalidate by content type (e.g., `countries`, `coffee`)

### Algolia Search Indexing

For blog posts with a slug, the endpoint automatically:

1. Fetches the full blog post data from Contentful
2. Extracts relevant fields (title, summary, author, categories, image)
3. Updates or creates the document in Algolia's search index
4. Logs success/failure (failures don't block cache revalidation)

### Path Revalidation

In addition to cache tags, specific paths are revalidated to ensure fresh data:

- Index pages (e.g., `/blog`)
- Detail pages (e.g., `/blog/{slug}`)
- Related pages (e.g., `/dashboard` for coffee updates)

### Architecture

```
┌─────────────────┐
│   Contentful    │
│     Webhook     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  /api/revalidate│
│    Endpoint     │
└────────┬────────┘
         │
         ├─► Determine Content Type
         ├─► Extract Slug (if available)
         ├─► Map to Cache Tags
         ├─► Map to Paths
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Next.js Cache  │     │     Algolia     │
│   Invalidation  │     │  Search Index   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ├─► revalidateTag()     │
         ├─► revalidatePath()    │
         │                       │
         └───────────────────────┴─► (Blog posts only)
                                     addOrUpdateObject()
```

---

## Maintenance

### Adding New Content Types

To add support for a new Contentful content type:

1. Update `getRevalidationTags()` in `/app/api/revalidate/route.ts`
2. Update `getRevalidationPaths()` with relevant paths
3. Add cache tags to the corresponding API calls in `/lib/contentful/api/`
4. Update this documentation

### Monitoring

Check the Vercel logs for revalidation activity:

```
Revalidated tag: blogPosts at 1234567890123
Revalidated tag: my-blog-post at 1234567890123
Revalidated path: /blog at 1234567890123
Revalidated path: /blog/my-blog-post at 1234567890123
```
