# API Route Patterns

## Overview

All API routes in this project follow consistent patterns for authentication, validation, error handling, and responses. This document defines the standard patterns for creating and maintaining API routes.

## Core Principles

1. **Edge Runtime** - Use Edge runtime for performance
2. **Type Safety** - Validate all inputs with Zod schemas
3. **Consistent Responses** - Use standard response helpers
4. **Rate Limiting** - Apply to all public endpoints
5. **Proper Authentication** - Use appropriate auth for each endpoint type

## File Structure

### Standard API Route Template

```typescript
// app/api/example/route.ts
export const runtime = "edge";

import { createErrorResponse, createSuccessResponse } from '@/lib/api/middleware';
import { assertSecret } from '@/lib/auth/secret';
import { rateLimit } from '@/lib/rate/limit';
import { z } from 'zod';

// 1. Define input schema
const ZInputSchema = z.object({
  field: z.string().min(1),
  count: z.number().int().positive().optional(),
});

type Input = z.infer<typeof ZInputSchema>;

// 2. GET handler (if needed)
export async function GET(request: Request) {
  try {
    // Rate limiting
    const rl = await rateLimit(request, "example-get", {
      windowSec: 60,
      max: 10,
    });

    if (!rl.ok) {
      return createErrorResponse(
        'Too many requests',
        429,
        undefined,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // Fetch data
    const data = await fetchData();

    return createSuccessResponse(data);
  } catch (error) {
    console.error('GET /api/example failed:', error);
    return createErrorResponse(
      'Failed to fetch data',
      500,
      process.env.NODE_ENV === 'development' ? error : undefined,
      'INTERNAL_ERROR'
    );
  }
}

// 3. POST handler (if needed)
export async function POST(request: Request) {
  try {
    // Authentication
    assertSecret(request);

    // Rate limiting
    const rl = await rateLimit(request, "example-post", {
      windowSec: 60,
      max: 5,
    });

    if (!rl.ok) {
      return createErrorResponse(
        'Too many requests',
        429,
        undefined,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // Parse and validate input
    const body = await request.json();
    const validation = ZInputSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        'Invalid input',
        400,
        validation.error.errors,
        'VALIDATION_ERROR'
      );
    }

    // Business logic
    const result = await performOperation(validation.data);

    return createSuccessResponse(result, 201);
  } catch (error) {
    // Check if it's an auth error
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401, undefined, 'UNAUTHORIZED');
    }

    console.error('POST /api/example failed:', error);
    return createErrorResponse(
      'Failed to process request',
      500,
      process.env.NODE_ENV === 'development' ? error : undefined,
      'INTERNAL_ERROR'
    );
  }
}
```

## Authentication Patterns

### Public Endpoints

```typescript
// No authentication, but rate-limited
export async function GET(request: Request) {
  const rl = await rateLimit(request, "public-endpoint", {
    windowSec: 60,
    max: 20,
  });

  if (!rl.ok) {
    return createErrorResponse('Too many requests', 429);
  }

  // ... rest of handler
}
```

### Admin Endpoints

```typescript
// Requires x-admin-secret header
import { assertSecret } from '@/lib/auth/secret';

export async function POST(request: Request) {
  try {
    assertSecret(request);

    // ... rest of handler
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }
    throw error;
  }
}
```

### Webhook Endpoints

```typescript
// Requires x-vercel-revalidation-key header
import { hasValidSecret } from '@/lib/auth/secret';

export async function POST(request: Request) {
  if (!hasValidSecret(request)) {
    return createErrorResponse('Unauthorized', 401);
  }

  // ... rest of handler
}
```

## Response Patterns

### Success Responses

```typescript
// Simple success (200)
return createSuccessResponse({ message: 'Updated successfully' });

// Created (201)
return createSuccessResponse({ id: newItem.id }, 201);

// Success with metadata
return createSuccessResponse({
  data: items,
  total: count,
  page: 1,
  timestamp: Date.now(),
});
```

### Error Responses

```typescript
// Validation error (400)
return createErrorResponse(
  'Invalid input',
  400,
  validationErrors,
  'VALIDATION_ERROR'
);

// Unauthorized (401)
return createErrorResponse(
  'Unauthorized',
  401,
  undefined,
  'UNAUTHORIZED'
);

// Not found (404)
return createErrorResponse(
  'Resource not found',
  404,
  undefined,
  'NOT_FOUND'
);

// Rate limit (429)
return createErrorResponse(
  'Too many requests',
  429,
  undefined,
  'RATE_LIMIT_EXCEEDED'
);

// Server error (500)
return createErrorResponse(
  'Internal server error',
  500,
  process.env.NODE_ENV === 'development' ? error : undefined,
  'INTERNAL_ERROR'
);
```

## Input Validation

### Zod Schema Patterns

```typescript
// Simple object
const ZInput = z.object({
  title: z.string().min(1).max(100),
  count: z.number().int().positive(),
});

// Optional fields
const ZInput = z.object({
  required: z.string(),
  optional: z.string().optional(),
  withDefault: z.number().default(10),
});

// Nested objects
const ZInput = z.object({
  user: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  settings: z.record(z.string(), z.unknown()),
});

// Arrays
const ZInput = z.object({
  tags: z.array(z.string()).min(1).max(10),
  ids: z.array(z.number().int().positive()),
});

// Enums
const ZInput = z.object({
  status: z.enum(['pending', 'active', 'completed']),
  type: z.literal('blogPost'),
});

// Custom validation
const ZInput = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
});
```

### Validation Error Handling

```typescript
const validation = ZInputSchema.safeParse(body);

if (!validation.success) {
  // Return structured validation errors
  return createErrorResponse(
    'Validation failed',
    400,
    validation.error.errors,
    'VALIDATION_ERROR'
  );
}

// Use validated data
const input = validation.data;
```

## Rate Limiting

### Standard Rate Limits

```typescript
// Public endpoints - 20 requests per minute
const rl = await rateLimit(request, "public", {
  windowSec: 60,
  max: 20,
});

// Search endpoints - 10 requests per minute
const rl = await rateLimit(request, "search", {
  windowSec: 60,
  max: 10,
});

// Mutation endpoints - 5 requests per minute
const rl = await rateLimit(request, "mutation", {
  windowSec: 60,
  max: 5,
});

// Webhook endpoints - 100 requests per minute
const rl = await rateLimit(request, "webhook", {
  windowSec: 60,
  max: 100,
});
```

### Rate Limit Response

```typescript
if (!rl.ok) {
  return createErrorResponse(
    'Too many requests. Please try again later.',
    429,
    {
      limit: rl.max,
      remaining: rl.remaining,
      reset: rl.reset,
    },
    'RATE_LIMIT_EXCEEDED'
  );
}
```

## Error Handling

### Try-Catch Pattern

```typescript
export async function POST(request: Request) {
  try {
    // 1. Authentication
    assertSecret(request);

    // 2. Rate limiting
    const rl = await rateLimit(request, "endpoint");
    if (!rl.ok) {
      return createErrorResponse('Too many requests', 429);
    }

    // 3. Validation
    const body = await request.json();
    const validation = ZSchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse('Invalid input', 400, validation.error);
    }

    // 4. Business logic
    const result = await operation(validation.data);

    // 5. Success response
    return createSuccessResponse(result);

  } catch (error) {
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return createErrorResponse('Unauthorized', 401);
      }

      if (error.message.includes('not found')) {
        return createErrorResponse('Not found', 404);
      }
    }

    // Generic error
    console.error('API error:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
}
```

### Structured Error Logging

```typescript
console.error('Operation failed:', {
  endpoint: '/api/example',
  method: 'POST',
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  timestamp: new Date().toISOString(),
});
```

## Webhook Patterns

### Contentful Webhook Handler

```typescript
export async function POST(request: Request) {
  // 1. Authenticate webhook
  if (!hasValidSecret(request)) {
    return createErrorResponse('Unauthorized', 401);
  }

  try {
    // 2. Parse payload
    const payload = await request.json();

    // 3. Validate payload structure
    const validation = ZContentfulPayload.safeParse(payload);
    if (!validation.success) {
      return createErrorResponse('Invalid payload', 400, validation.error);
    }

    const { contentTypeId, slug } = validation.data;

    // 4. Handle different content types
    const tagsToRevalidate: string[] = [];
    const pathsToRevalidate: string[] = [];

    if (contentTypeId === 'blogPost' && slug) {
      tagsToRevalidate.push('blogPosts', slug);
      pathsToRevalidate.push('/blog', `/blog/${slug}`);

      // Additional operations (e.g., update search index)
      await updateSearchIndex(slug);
    }

    // 5. Revalidate cache
    for (const tag of tagsToRevalidate) {
      revalidateTag(tag);
    }

    for (const path of pathsToRevalidate) {
      revalidatePath(path);
    }

    // 6. Return detailed response
    return createSuccessResponse({
      revalidated: true,
      tags: tagsToRevalidate,
      paths: pathsToRevalidate,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Webhook processing failed:', error);
    return createErrorResponse('Webhook processing failed', 500);
  }
}
```

### Webhook Payload Schemas

```typescript
const ZContentfulPayload = z.object({
  sys: z.object({
    id: z.string(),
    contentType: z.object({
      sys: z.object({
        id: z.string(),
      }),
    }),
  }),
  fields: z.object({
    slug: z.object({
      'en-US': z.string(),
    }).optional(),
  }).optional(),
});

// Extract helper
function extractContentfulData(payload: unknown) {
  const validation = ZContentfulPayload.safeParse(payload);
  if (!validation.success) {
    return null;
  }

  const data = validation.data;
  return {
    contentTypeId: data.sys.contentType.sys.id,
    slug: data.fields?.slug?.['en-US'],
    id: data.sys.id,
  };
}
```

## Database Operations

### Query Pattern

```typescript
import { sql } from '@vercel/postgres';
import { z } from 'zod';

// 1. Define response schema
const ZUserRow = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  created_at: z.string(),
});

type UserRow = z.infer<typeof ZUserRow>;

// 2. Query with validation
export async function getUser(id: number): Promise<UserRow> {
  const { rows } = await sql`
    SELECT id, name, email, created_at
    FROM users
    WHERE id = ${id}
  `;

  if (rows.length === 0) {
    throw new Error('User not found');
  }

  // Validate response
  return ZUserRow.parse(rows[0]);
}
```

### Mutation Pattern

```typescript
export async function createUser(data: { name: string; email: string }) {
  const { rows } = await sql`
    INSERT INTO users (name, email)
    VALUES (${data.name}, ${data.email})
    RETURNING id, name, email, created_at
  `;

  return ZUserRow.parse(rows[0]);
}
```

## External API Calls

### Pattern with Error Handling

```typescript
async function updateSearchIndex(slug: string) {
  try {
    const post = await getBlog(slug);

    await externalApiClient.update({
      id: post.sys.id,
      data: {
        title: post.title,
        summary: post.summary,
        url: `${SITE_URL}/blog/${slug}`,
      },
    });

    console.log('Search index updated:', slug);
  } catch (error) {
    // Log but don't fail the request
    console.error('Failed to update search index:', {
      slug,
      error: error instanceof Error ? error.message : String(error),
    });

    // Could also report to monitoring service
  }
}
```

## Response Types

### Standard Response Format

```typescript
// Success response
{
  "data": { /* response data */ },
  "timestamp": 1234567890
}

// Error response
{
  "error": "User-friendly error message",
  "code": "ERROR_CODE",
  "details": { /* debug info, dev only */ }
}
```

### Pagination Response

```typescript
return createSuccessResponse({
  items: results,
  pagination: {
    page: currentPage,
    limit: POSTS_PER_PAGE,
    total: totalCount,
    totalPages: Math.ceil(totalCount / POSTS_PER_PAGE),
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  },
});
```

## Testing API Routes

### Manual Testing

```bash
# GET request
curl http://localhost:3000/api/example

# POST request with JSON body
curl -X POST http://localhost:3000/api/example \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your-secret" \
  -d '{"field":"value"}'

# Webhook test
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-vercel-revalidation-key: your-secret" \
  -d @webhook-payload.json
```

### Example Payloads

```json
// Blog post webhook
{
  "sys": {
    "id": "abc123",
    "contentType": {
      "sys": { "id": "blogPost" }
    }
  },
  "fields": {
    "slug": { "en-US": "my-blog-post" }
  }
}
```

## Anti-Patterns

### ❌ Avoid

```typescript
// ❌ No error handling
export async function POST(request: Request) {
  const data = await fetchData();
  return Response.json(data);
}

// ❌ No validation
export async function POST(request: Request) {
  const body = await request.json();
  await saveData(body);  // Unvalidated!
  return Response.json({ success: true });
}

// ❌ Inconsistent responses
export async function GET(request: Request) {
  if (error) {
    return Response.json({ message: 'Failed' }, { status: 500 });
  }
  return Response.json({ data: result });  // Different format!
}

// ❌ No rate limiting on public endpoints
export async function GET(request: Request) {
  // Anyone can spam this endpoint
  return createSuccessResponse(await fetchData());
}

// ❌ Exposing error details in production
return createErrorResponse(
  'Failed',
  500,
  error,  // Always exposing error details!
);
```

### ✅ Good Patterns

```typescript
// ✅ Complete error handling
export async function POST(request: Request) {
  try {
    assertSecret(request);
    const rl = await rateLimit(request, "endpoint");
    if (!rl.ok) return createErrorResponse('Rate limited', 429);

    const body = await request.json();
    const validation = ZSchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse('Invalid', 400, validation.error);
    }

    const result = await operation(validation.data);
    return createSuccessResponse(result);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(
      'Failed',
      500,
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
}
```

## Checklist for New API Routes

Before committing a new API route:

- [ ] Runtime set to `"edge"`
- [ ] Input validation with Zod schema
- [ ] Authentication applied (if needed)
- [ ] Rate limiting configured
- [ ] Error handling with try-catch
- [ ] Consistent response format (use helpers)
- [ ] Structured error logging
- [ ] TypeScript types defined
- [ ] No `any` types used
- [ ] Development-only debug info guarded
- [ ] Tested with curl or similar tool
- [ ] Added to API documentation (README)
