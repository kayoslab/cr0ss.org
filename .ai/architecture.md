# Architecture Specification

## Overview

cr0ss.org is a Next.js 14 application using the App Router with a headless CMS (Contentful), serverless database (Neon PostgreSQL), and search platform (Algolia).

## Core Principles

### 1. Server-First Architecture

- **Default to Server Components** - Use React Server Components by default
- **Client Components Only When Needed** - Mark with `'use client'` directive only when necessary
- **Edge Runtime for APIs** - Use `export const runtime = "edge"` for API routes when possible

### 2. Static Generation with Dynamic Revalidation

- **Static by Default** - Pre-render all content at build time
- **Dynamic Revalidation** - Use cache tags and webhook-based revalidation
- **ISR for Large Collections** - Use Incremental Static Regeneration for blog posts

### 3. Type Safety

- **Strict TypeScript** - All code must compile with `strict: true`
- **No `any` Types** - Always provide proper types
- **Zod for Runtime Validation** - Use Zod schemas for API inputs and environment variables
- **Type Inference** - Let TypeScript infer types when obvious

### 4. Separation of Concerns

```
┌─────────────────────────────────────────────────────┐
│                    app/ (Routes)                    │
│  - Pages (Server Components)                        │
│  - API Routes (Edge Runtime)                        │
│  - Metadata Generation                              │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────┐
│            components/ (UI Components)              │
│  - Presentational Components                        │
│  - Client Components (marked with 'use client')     │
│  - Reusable UI Elements                             │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────┐
│              lib/ (Business Logic)                  │
│  - Data Fetching (Contentful, Database)            │
│  - Utilities (metadata, constants, helpers)         │
│  - API Middleware (auth, errors, validation)        │
│  - Type Definitions                                 │
└─────────────────────────────────────────────────────┘
```

## Directory Structure

### `/app` - Application Routes

**Purpose**: Next.js App Router pages and API routes

**Rules**:
- One `page.tsx` per route
- API routes in `route.ts` files
- Metadata generation via `generateMetadata()`
- Static params via `generateStaticParams()`
- Layout files for shared UI

**Example**:
```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const blog = await getBlog(params.slug);
  return createBlogMetadata({ /* ... */ });
}

export async function generateStaticParams() {
  const blogs = await getAllBlogs();
  return blogs.items.map(blog => ({ slug: blog.slug }));
}

export default async function BlogPage({ params }: Props) {
  const blog = await getBlog(params.slug);
  return <Blog blog={blog} />;
}
```

### `/components` - React Components

**Purpose**: Reusable UI components

**Rules**:
- Organized by feature (e.g., `blog/`, `dashboard/`)
- Server Components by default
- Client Components marked with `'use client'`
- Props interfaces defined inline or imported

**Naming**:
- Files: `kebab-case.tsx`
- Components: `PascalCase`

### `/lib` - Business Logic & Utilities

**Purpose**: Shared logic, data fetching, utilities

**Structure**:
```
lib/
├── api/                  # API utilities
│   ├── middleware.ts    # Error handling, validation
│   └── dashboard.ts     # Response schemas
├── auth/                # Authentication
│   ├── constants.tsx
│   └── secret.tsx
├── contentful/          # CMS integration
│   ├── api/            # Data fetching
│   ├── props/          # Type definitions
│   └── rich-text-renderer.tsx
├── db/                  # Database
│   ├── queries.tsx
│   ├── models.tsx
│   └── validation.tsx
├── constants.ts         # Shared constants
└── metadata.ts          # SEO helpers
```

## Data Flow

### 1. Content from Contentful

```typescript
// ✅ Good: Centralized fetching with cache tags
export async function getBlog(slug: string) {
  const query = `query { ... }`;
  const response = await fetchGraphQL(query, ['blogPosts', slug]);
  return response.data.blogPostCollection.items[0];
}

// ❌ Bad: Direct fetch without caching
export async function getBlog(slug: string) {
  const response = await fetch(CONTENTFUL_URL);
  return response.json();
}
```

**Rules**:
- All Contentful queries go through `fetchGraphQL()`
- Always provide cache tags for revalidation
- Use GraphQL fields constants (e.g., `BLOG_GRAPHQL_FIELDS`)
- Return typed responses

### 2. Database Queries

```typescript
// ✅ Good: Parameterized queries with Zod validation
export async function qCupsToday() {
  const rows = await sql`
    SELECT brew_method, COUNT(*) as count
    FROM coffee_events
    WHERE event_date = CURRENT_DATE
    GROUP BY brew_method
  `;
  return ZBrewMethodsToday.parse(rows);
}

// ❌ Bad: String interpolation, no validation
export async function qCupsToday() {
  const date = new Date().toISOString();
  const rows = await sql`SELECT * FROM coffee_events WHERE date='${date}'`;
  return rows;
}
```

**Rules**:
- Use parameterized queries (template literals)
- Validate responses with Zod schemas
- Define schemas in `lib/db/models.tsx`
- Export typed functions

### 3. API Routes

```typescript
// ✅ Good: Type-safe with error handling
export async function GET(request: Request) {
  try {
    assertSecret(request);
    const data = await fetchDashboardData();
    return createSuccessResponse(data);
  } catch (error) {
    return createErrorResponse('Failed', 500);
  }
}

// ❌ Bad: No error handling, untyped
export async function GET(request: Request) {
  const data = await fetchDashboardData();
  return Response.json(data);
}
```

**Rules**:
- Use `createErrorResponse()` and `createSuccessResponse()`
- Validate inputs with Zod schemas
- Apply rate limiting where needed
- Use `assertSecret()` for protected routes

## Caching Strategy

### Cache Tags

**Pattern**:
- Collection tags: `blogPosts`, `pages`, `countries`, `coffee`
- Item tags: slug or ID (e.g., `my-blog-post`)

**Example**:
```typescript
// Fetch with cache tags
await fetchGraphQL(query, ['blogPosts', slug]);

// Revalidate on webhook
revalidateTag('blogPosts');  // Invalidate collection
revalidateTag(slug);         // Invalidate specific item
```

### Path Revalidation

**When to use**:
- Index pages: `/blog`
- Detail pages: `/blog/{slug}`
- Related pages: `/dashboard` for coffee updates

## Performance Guidelines

### 1. Image Optimization

```typescript
// ✅ Good: Next.js Image component
import Image from 'next/image';
<Image src={url} width={1200} height={630} alt="..." />

// ❌ Bad: Raw img tag
<img src={url} alt="..." />
```

### 2. Code Splitting

- Server Components: Auto-split by route
- Client Components: Use dynamic imports for large components
- API Routes: Keep lightweight, delegate to lib/

### 3. Data Fetching

- Fetch in Server Components
- Parallel fetches with `Promise.all()`
- Avoid waterfall requests

## Error Handling

### Standard Pattern

```typescript
try {
  // Operation
  const result = await operation();
  return createSuccessResponse(result);
} catch (error) {
  console.error('Operation failed:', error);
  return createErrorResponse(
    'User-friendly message',
    500,
    process.env.NODE_ENV === 'development' ? error.message : undefined,
    'ERROR_CODE'
  );
}
```

### Error Response Format

```typescript
{
  error: string;         // User-friendly message
  details?: unknown;     // Debug info (dev only)
  code?: string;         // Machine-readable code
}
```

## Security

### Authentication

- **Protected Routes**: Use `assertSecret(request)`
- **Webhook Endpoints**: Use `hasValidSecret(request)`
- **Rate Limiting**: Apply to all public APIs

### Environment Variables

- All secrets in `.env` files
- Validated with Zod in `env.ts`
- Never commit secrets

### Content Security

- Sanitize user inputs (though we have no user input currently)
- Validate Contentful webhook payloads
- Use prepared statements for database queries

## Deployment

### Vercel Configuration

- **Edge Runtime**: For API routes and dynamic content
- **Static Generation**: For all blog posts and pages
- **Environment Variables**: Set in Vercel dashboard
- **Caching**: Relies on Next.js cache tags

### Build Process

```bash
npm run build  # Must pass without errors
npm run lint   # Must pass without warnings
npx tsc --noEmit  # Must pass type checking
```

## Anti-Patterns

### ❌ Avoid

1. **Client-side data fetching** - Fetch on server instead
2. **Inline styles** - Use Tailwind classes
3. **Any types** - Always provide proper types
4. **String interpolation in queries** - Use parameterized queries
5. **Multiple cache tag systems** - Stick to Next.js cache tags
6. **Duplicate code** - Extract to shared utilities
7. **Magic numbers** - Use named constants
8. **Unhandled errors** - Always wrap in try-catch

## Migration Path

When updating patterns:

1. **Document new pattern** in this file
2. **Update existing code** to follow pattern
3. **Test thoroughly** - TypeScript, lint, build
4. **Update examples** in this document
5. **Commit with ADR reference**
