# Security Guidelines

## Overview

This document outlines security practices, patterns, and requirements for the cr0ss.org codebase. Security is built into every layer of the application from authentication to data validation to deployment.

## Core Security Principles

1. **Defense in Depth** - Multiple layers of security
2. **Least Privilege** - Grant minimum necessary permissions
3. **Input Validation** - Never trust user input
4. **Secure by Default** - Safe defaults, opt-in to less secure options
5. **Fail Securely** - Errors should not expose sensitive information

## Authentication & Authorization

### Authentication Methods

The application uses two authentication methods:

1. **Admin Secret** - For admin API routes and dashboard operations
2. **Webhook Secret** - For Contentful webhook endpoints

```typescript
// lib/auth/secret.tsx

// ✅ Good: Using authentication helper
import { assertSecret, hasValidSecret } from '@/lib/auth/secret';

// Admin endpoints (throws on failure)
export async function POST(request: Request) {
  assertSecret(request);  // Throws "Unauthorized" if invalid
  // ... protected logic
}

// Webhook endpoints (returns boolean)
export async function POST(request: Request) {
  if (!hasValidSecret(request)) {
    return createErrorResponse('Unauthorized', 401);
  }
  // ... webhook logic
}
```

### Secret Headers

```typescript
// Admin operations
headers: {
  'x-admin-secret': process.env.DASHBOARD_API_SECRET
}

// Contentful webhooks
headers: {
  'x-vercel-revalidation-key': process.env.CONTENTFUL_REVALIDATE_SECRET
}
```

### Authentication Best Practices

```typescript
// ✅ Good: Check auth first, before any processing
export async function POST(request: Request) {
  assertSecret(request);

  const body = await request.json();
  // ... rest of handler
}

// ❌ Bad: Processing before auth check
export async function POST(request: Request) {
  const body = await request.json();
  const result = await expensiveOperation(body);

  assertSecret(request);  // Too late!
  return createSuccessResponse(result);
}

// ❌ Bad: Not checking auth at all
export async function POST(request: Request) {
  // Anyone can call this!
  return createSuccessResponse(await sensitiveOperation());
}
```

## Environment Variables

### Secret Management

```typescript
// env.ts - Validated environment variables

import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // Contentful
    CONTENTFUL_SPACE_ID: z.string().min(1),
    CONTENTFUL_ACCESS_TOKEN: z.string().min(1),
    CONTENTFUL_REVALIDATE_SECRET: z.string().min(32),  // Minimum length

    // Database
    DATABASE_URL: z.string().url(),

    // API Secrets
    DASHBOARD_API_SECRET: z.string().min(32),  // Strong secrets

    // External services
    ALGOLIA_APP_ID: z.string().min(1),
    ALGOLIA_ADMIN_KEY: z.string().min(1),
  },

  client: {
    // Only non-sensitive values exposed to client
    NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: z.string().min(1),
  },

  runtimeEnv: {
    CONTENTFUL_SPACE_ID: process.env.CONTENTFUL_SPACE_ID,
    // ... map all variables
  },
});
```

### Environment Variable Rules

```typescript
// ✅ Good: Server-only secrets
import { env } from '@/env';
const secret = env.DASHBOARD_API_SECRET;  // Only on server

// ✅ Good: Public client variables (prefixed with NEXT_PUBLIC_)
const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

// ❌ Bad: Exposing secrets to client
'use client';
const secret = process.env.DASHBOARD_API_SECRET;  // Leaked to browser!

// ❌ Bad: Hardcoding secrets
const apiKey = "abc123-secret-key";  // Never do this!

// ❌ Bad: Weak secrets
DASHBOARD_API_SECRET=weak  // Too short, not random
```

### Secret Generation

```bash
# ✅ Generate strong secrets (32+ characters)
openssl rand -base64 32

# ✅ Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Example output:
# kR9vM2pQ7xL5nW8tF3jK6hD4gS1aU0cY9bV7mN5qE8=
```

### Never Commit Secrets

```bash
# ✅ .gitignore (already configured)
.env
.env.local
.env.development.local
.env.production.local

# ❌ Never commit these files
git add .env.local  # Don't do this!
```

## Input Validation

### Zod Schema Validation

```typescript
// ✅ Good: Validate all inputs with Zod
import { z } from 'zod';

const ZBlogInput = z.object({
  slug: z.string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/),  // Only safe characters
  title: z.string()
    .min(1)
    .max(200)
    .trim(),  // Sanitize whitespace
  content: z.string()
    .min(1)
    .max(50000),
});

export async function POST(request: Request) {
  const body = await request.json();
  const validation = ZBlogInput.safeParse(body);

  if (!validation.success) {
    return createErrorResponse('Invalid input', 400, validation.error);
  }

  // Safe to use validated data
  const data = validation.data;
}

// ❌ Bad: No validation
export async function POST(request: Request) {
  const body = await request.json();
  await saveToDatabase(body);  // Dangerous!
}
```

### Common Validation Patterns

```typescript
// Email validation
const ZEmail = z.string().email();

// URL validation
const ZUrl = z.string().url();

// Safe slug
const ZSlug = z.string().regex(/^[a-z0-9-]+$/);

// Limited length strings
const ZTitle = z.string().min(1).max(200);

// Positive integers
const ZId = z.number().int().positive();

// Enum values
const ZStatus = z.enum(['draft', 'published', 'archived']);

// Date strings
const ZDate = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Invalid date format' }
);

// Arrays with limits
const ZTags = z.array(z.string()).min(1).max(10);

// Nested objects
const ZUser = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  settings: z.object({
    notifications: z.boolean(),
    theme: z.enum(['light', 'dark']),
  }),
});
```

### Sanitization

```typescript
// ✅ Good: Trim and sanitize strings
const ZInput = z.object({
  title: z.string().trim().min(1),
  email: z.string().email().toLowerCase(),
});

// ✅ Good: Remove potentially dangerous characters
const ZSlug = z.string().regex(/^[a-z0-9-]+$/);

// ⚠️ Be careful with user-generated HTML
// This project uses Contentful rich text, which is safe
// If accepting HTML from users, use a sanitization library
import DOMPurify from 'isomorphic-dompurify';
const sanitized = DOMPurify.sanitize(userInput);
```

## Database Security

### SQL Injection Prevention

```typescript
// ✅ Good: Parameterized queries with template literals
import { sql } from '@vercel/postgres';

export async function getUser(id: number) {
  const { rows } = await sql`
    SELECT * FROM users
    WHERE id = ${id}
  `;
  return rows[0];
}

// ✅ Good: Multiple parameters
export async function getCoffeeEvents(startDate: string, endDate: string) {
  const { rows } = await sql`
    SELECT * FROM coffee_events
    WHERE event_date >= ${startDate}
      AND event_date <= ${endDate}
  `;
  return rows;
}

// ❌ Bad: String interpolation (SQL injection risk!)
export async function getUser(id: number) {
  const query = `SELECT * FROM users WHERE id = ${id}`;
  const { rows } = await sql.unsafe(query);  // Dangerous!
}

// ❌ Bad: String concatenation
export async function searchUsers(name: string) {
  const query = "SELECT * FROM users WHERE name = '" + name + "'";
  // If name = "'; DROP TABLE users; --" → disaster!
}
```

### Query Validation

```typescript
// ✅ Good: Validate query results with Zod
const ZUserRow = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

export async function getUser(id: number) {
  const { rows } = await sql`
    SELECT id, name, email FROM users WHERE id = ${id}
  `;

  if (rows.length === 0) {
    throw new Error('User not found');
  }

  return ZUserRow.parse(rows[0]);  // Validate structure
}
```

### Database Connection Security

```typescript
// ✅ Good: Connection string in environment variable
DATABASE_URL=postgresql://user:password@host:5432/database

// ✅ Good: Use SSL in production
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

// ❌ Bad: Hardcoded credentials
const connectionString = "postgresql://admin:password123@localhost/mydb";
```

## Rate Limiting

### Implementation

```typescript
// lib/rate/limit.ts

import { kv } from '@vercel/kv';

interface RateLimitConfig {
  windowSec: number;  // Time window in seconds
  max: number;        // Max requests in window
}

export async function rateLimit(
  request: Request,
  identifier: string,
  config: RateLimitConfig = { windowSec: 60, max: 10 }
): Promise<{
  ok: boolean;
  remaining: number;
  reset: number;
  max: number;
}> {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const key = `ratelimit:${identifier}:${ip}`;

  const count = await kv.incr(key);

  if (count === 1) {
    await kv.expire(key, config.windowSec);
  }

  const ttl = await kv.ttl(key);

  return {
    ok: count <= config.max,
    remaining: Math.max(0, config.max - count),
    reset: Date.now() + (ttl * 1000),
    max: config.max,
  };
}
```

### Rate Limit Patterns

```typescript
// ✅ Public endpoints - Moderate limits
export async function GET(request: Request) {
  const rl = await rateLimit(request, "public-api", {
    windowSec: 60,
    max: 20,
  });

  if (!rl.ok) {
    return createErrorResponse('Too many requests', 429);
  }
  // ... handler logic
}

// ✅ Search endpoints - Stricter limits
export async function POST(request: Request) {
  const rl = await rateLimit(request, "search", {
    windowSec: 60,
    max: 10,
  });

  if (!rl.ok) {
    return createErrorResponse('Rate limit exceeded', 429);
  }
  // ... search logic
}

// ✅ Mutation endpoints - Very strict
export async function POST(request: Request) {
  assertSecret(request);

  const rl = await rateLimit(request, "mutation", {
    windowSec: 60,
    max: 5,
  });

  if (!rl.ok) {
    return createErrorResponse('Rate limit exceeded', 429);
  }
  // ... mutation logic
}

// ✅ Webhook endpoints - Higher limits (trusted source)
export async function POST(request: Request) {
  if (!hasValidSecret(request)) {
    return createErrorResponse('Unauthorized', 401);
  }

  const rl = await rateLimit(request, "webhook", {
    windowSec: 60,
    max: 100,
  });

  if (!rl.ok) {
    return createErrorResponse('Rate limit exceeded', 429);
  }
  // ... webhook logic
}
```

## CORS & Headers

### Security Headers

```typescript
// next.config.js

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### CORS Configuration

```typescript
// API routes - Restrict CORS when possible
export async function POST(request: Request) {
  // Default: No CORS (same-origin only)

  // If CORS needed:
  const origin = request.headers.get('origin');
  const allowedOrigins = ['https://cr0ss.org', 'https://www.cr0ss.org'];

  if (!origin || !allowedOrigins.includes(origin)) {
    return createErrorResponse('Forbidden', 403);
  }

  // ... handler logic

  // Add CORS headers to response
  return new Response(JSON.stringify(data), {
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

## Error Handling

### Secure Error Messages

```typescript
// ✅ Good: Generic error message to user, detailed logs on server
export async function POST(request: Request) {
  try {
    const result = await operation();
    return createSuccessResponse(result);
  } catch (error) {
    // Log detailed error on server
    console.error('Operation failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // Return generic error to client
    return createErrorResponse(
      'An error occurred processing your request',
      500,
      process.env.NODE_ENV === 'development' ? error : undefined,  // Details only in dev
      'INTERNAL_ERROR'
    );
  }
}

// ❌ Bad: Exposing internal errors
export async function POST(request: Request) {
  try {
    const result = await operation();
    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(
      error.message,  // Might expose sensitive info!
      500,
      error  // Exposing stack traces!
    );
  }
}
```

### Error Response Format

```typescript
// ✅ Safe error responses
{
  "error": "User-friendly message",
  "code": "ERROR_CODE",
  "details": { /* Only in development */ }
}

// Examples:
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": { /* Zod error details, dev only */ }
}

{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
  // No details exposed
}

{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
  // No stack trace in production
}
```

## Webhook Security

### Webhook Validation

```typescript
// ✅ Good: Validate webhook source
export async function POST(request: Request) {
  // 1. Check secret
  if (!hasValidSecret(request)) {
    return createErrorResponse('Unauthorized', 401);
  }

  // 2. Validate payload structure
  const payload = await request.json();
  const validation = ZWebhookPayload.safeParse(payload);

  if (!validation.success) {
    return createErrorResponse('Invalid payload', 400);
  }

  // 3. Rate limit
  const rl = await rateLimit(request, "webhook");
  if (!rl.ok) {
    return createErrorResponse('Rate limit exceeded', 429);
  }

  // 4. Process webhook
  const result = await processWebhook(validation.data);
  return createSuccessResponse(result);
}
```

### Webhook Payload Schema

```typescript
const ZContentfulWebhook = z.object({
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
      'en-US': z.string().optional(),
    }).optional(),
  }).optional(),
});
```

## Content Security

### Rich Text Rendering

```typescript
// ✅ Safe: Contentful rich text is sanitized
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';

export function BlogArticle({ blog }: Props) {
  return (
    <article>
      {documentToReactComponents(blog.details.json, renderOptions)}
    </article>
  );
}

// ❌ Dangerous: Raw HTML from untrusted sources
export function Article({ html }: Props) {
  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />  // Only if sanitized!
  );
}
```

### Image Security

```typescript
// ✅ Good: Use Next.js Image component
import Image from 'next/image';

<Image
  src={blog.heroImage.url}
  alt={blog.heroImage.description || blog.title}
  width={1200}
  height={630}
/>

// ✅ Good: Validate image URLs
function ensureAbsoluteUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  // Contentful returns protocol-relative URLs
  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  // Ensure HTTPS
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }

  return url;
}
```

## Deployment Security

### Vercel Configuration

```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### Environment Variables in Vercel

1. **Add secrets in Vercel Dashboard**
   - Settings → Environment Variables
   - Never commit to Git

2. **Separate environments**
   - Production secrets
   - Preview secrets (can be different)
   - Development (local .env.local)

3. **Rotate secrets regularly**
   - Update in Vercel Dashboard
   - Update in webhook configurations
   - Test before deploying

## Security Checklist

### For Every API Route

- [ ] Authentication implemented (if needed)
- [ ] Rate limiting configured
- [ ] Input validation with Zod
- [ ] Parameterized database queries
- [ ] Secure error handling (no sensitive info leaked)
- [ ] CORS configured correctly
- [ ] Environment variables used for secrets
- [ ] Logging for security events

### For Every Component

- [ ] No hardcoded secrets
- [ ] No sensitive data in client components
- [ ] Proper sanitization of user content
- [ ] Images from trusted sources only
- [ ] No `dangerouslySetInnerHTML` (unless sanitized)

### For Every Deployment

- [ ] Environment variables configured
- [ ] Secrets rotated if needed
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] No secrets in Git history
- [ ] Dependencies up to date (no known vulnerabilities)

## Security Resources

### Keeping Dependencies Secure

```bash
# Check for vulnerabilities
npm audit

# Fix automatically (if possible)
npm audit fix

# Review and update dependencies
npm outdated
npm update
```

### Monitoring

- Review Vercel logs for suspicious activity
- Monitor rate limit hits
- Check for unusual API usage patterns
- Review failed authentication attempts

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not open a public issue**
2. Email the project maintainer directly
3. Include details and steps to reproduce
4. Allow time for a fix before disclosure

## Anti-Patterns

### ❌ Security Anti-Patterns

```typescript
// ❌ Exposing secrets
'use client';
const apiKey = process.env.DASHBOARD_API_SECRET;

// ❌ No input validation
const body = await request.json();
await saveToDatabase(body);

// ❌ SQL injection
const query = `SELECT * FROM users WHERE name = '${name}'`;

// ❌ No rate limiting on public endpoint
export async function POST(request: Request) {
  return createSuccessResponse(await operation());
}

// ❌ Detailed errors in production
catch (error) {
  return Response.json({ error: error.message, stack: error.stack });
}

// ❌ Weak secrets
DASHBOARD_API_SECRET=password123

// ❌ Hardcoded secrets
const secret = "abc123-hardcoded-secret";

// ❌ No authentication
export async function POST(request: Request) {
  // Anyone can call this sensitive operation
  await deleteAllData();
}
```

