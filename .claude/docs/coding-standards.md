# Coding Standards

## TypeScript

### Type Definitions

**✅ Good**:
```typescript
interface BlogProps {
  sys: {
    id: string;
    firstPublishedAt: string;
  };
  slug: string;
  title: string;
  categoriesCollection: {
    items: CategoryProps[];  // Array type
  };
}
```

**❌ Bad**:
```typescript
interface BlogProps {
  sys: any;  // Never use 'any'
  slug: string;
  title: string;
  categories: any[];  // Untyped array
}
```

### Type Imports

```typescript
// ✅ Use 'type' imports for type-only imports
import type { Metadata } from 'next';
import type { BlogProps } from '@/lib/contentful/api/props/blog';

// ✅ Regular imports for values
import { getBlog } from '@/lib/contentful/api/blog';
```

### Function Types

```typescript
// ✅ Good: Explicit return type for exported functions
export async function getBlog(slug: string): Promise<BlogProps> {
  // ...
}

// ✅ Good: Inferred types for internal functions
function formatDate(date: Date) {
  return date.toISOString();
}
```

### Zod Schemas

```typescript
// ✅ Define schema, infer type
const ZBlogPost = z.object({
  title: z.string(),
  slug: z.string(),
  content: z.string(),
});

type BlogPost = z.infer<typeof ZBlogPost>;

// ❌ Don't define both separately
type BlogPost = {
  title: string;
  slug: string;
  content: string;
};
```

## Naming Conventions

### Variables & Functions

```typescript
// ✅ camelCase for variables and functions
const blogPosts = await getAllBlogs();
const totalCount = blogPosts.length;

function calculateReadTime(content: string): number {
  // ...
}
```

### Constants

```typescript
// ✅ SCREAMING_SNAKE_CASE for constants
export const POSTS_PER_PAGE = 9;
export const SITE_URL = 'https://cr0ss.org';
export const OG_IMAGE_WIDTH = 1200;

// ❌ Don't use camelCase for constants
const postsPerPage = 9;
```

### Components

```typescript
// ✅ PascalCase for components, kebab-case for files
// File: blog-grid.tsx
export function BlogGrid({ posts }: Props) {
  // ...
}

// File: blog-article.tsx
export const Blog = ({ blog }: Props) => {
  // ...
};
```

### Types & Interfaces

```typescript
// ✅ PascalCase, descriptive names
interface BlogProps {
  // ...
}

type ContentfulWebhookPayload = {
  // ...
};

// ✅ Prefix Zod schemas with 'Z'
const ZDashboardData = z.object({
  // ...
});
```

## File Organization

### Imports Order

```typescript
// 1. React & Next.js
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// 2. External libraries
import { algoliasearch } from 'algoliasearch';

// 3. Internal - absolute imports with @/
import { getBlog } from '@/lib/contentful/api/blog';
import { createBlogMetadata } from '@/lib/metadata';
import type { BlogProps } from '@/lib/contentful/api/props/blog';

// 4. Relative imports (avoid if possible)
import { BlogGrid } from './blog-grid';
```

### File Structure

```typescript
// 1. Exports (runtime, config)
export const runtime = "edge";

// 2. Type definitions
interface Props {
  params: { slug: string };
}

// 3. Helper functions (private)
function formatDate(date: string) {
  // ...
}

// 4. Main exported functions
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // ...
}

export default async function Page({ params }: Props) {
  // ...
}
```

## React Patterns

### Server Components (Default)

```typescript
// ✅ Server Component (no directive needed)
export default async function BlogPage({ params }: Props) {
  const blog = await getBlog(params.slug);
  return <Blog blog={blog} />;
}
```

### Client Components

```typescript
// ✅ Explicitly mark client components
'use client';

import { useState } from 'react';

export function SearchBar() {
  const [query, setQuery] = useState('');
  // ...
}
```

### Component Props

```typescript
// ✅ Define props interface inline or nearby
interface BlogCardProps {
  blog: BlogProps;
  featured?: boolean;
}

export function BlogCard({ blog, featured = false }: BlogCardProps) {
  // ...
}
```

### Conditional Rendering

```typescript
// ✅ Early returns for error states
if (!blog) {
  notFound();
}

if (error) {
  return <ErrorMessage error={error} />;
}

// ✅ Ternary for simple conditions
return (
  <div className={featured ? 'featured' : 'regular'}>
    {/* ... */}
  </div>
);

// ✅ Logical AND for optional rendering
{isLoading && <Spinner />}
{posts.length > 0 && <BlogGrid posts={posts} />}
```

## API Routes

### Structure

```typescript
export const runtime = "edge";

import { createErrorResponse, createSuccessResponse } from '@/lib/api/middleware';

export async function POST(request: Request) {
  // 1. Authentication
  if (!hasValidSecret(request)) {
    return createErrorResponse('Unauthorized', 401, undefined, 'UNAUTHORIZED');
  }

  // 2. Input validation
  const body = await request.json();
  const validation = ZInputSchema.safeParse(body);
  if (!validation.success) {
    return createErrorResponse('Invalid input', 400, validation.error, 'VALIDATION_ERROR');
  }

  // 3. Business logic
  try {
    const result = await performOperation(validation.data);
    return createSuccessResponse(result);
  } catch (error) {
    console.error('Operation failed:', error);
    return createErrorResponse('Failed', 500, undefined, 'OPERATION_ERROR');
  }
}
```

### Response Patterns

```typescript
// ✅ Use helper functions
return createSuccessResponse({ data, timestamp: Date.now() });
return createErrorResponse('Message', 400, details, 'CODE');

// ❌ Don't use raw Response
return Response.json({ error: 'Failed' }, { status: 500 });
```

## Error Handling

### Try-Catch Blocks

```typescript
// ✅ Specific error handling
try {
  const data = await fetchData();
  return processData(data);
} catch (error) {
  if (error instanceof NotFoundError) {
    return notFound();
  }

  console.error('Failed to process:', error);
  throw error;  // Re-throw if can't handle
}
```

### Error Logging

```typescript
// ✅ Structured logging
console.error('Operation failed:', {
  operation: 'getBlog',
  slug,
  error: error instanceof Error ? error.message : String(error),
});

// ❌ Generic logging
console.error(error);
```

## Styling

### Tailwind Classes

```typescript
// ✅ Semantic grouping, readable
<div className="
  flex flex-col items-center justify-between
  min-h-screen pb-24
  bg-white dark:bg-slate-800
">

// ❌ Random order, hard to read
<div className="pb-24 dark:bg-slate-800 min-h-screen flex bg-white justify-between items-center flex-col">
```

### Conditional Classes

```typescript
// ✅ Template literals for dynamic classes
<div className={`base-class ${isActive ? 'active' : 'inactive'}`}>

// ✅ clsx/cn for complex conditions (if installed)
<div className={cn(
  'base-class',
  isActive && 'active',
  isPending && 'pending'
)}>
```

## Comments

### When to Comment

```typescript
// ✅ Explain WHY, not WHAT
// Contentful returns protocol-relative URLs, prepend https:
const absoluteUrl = url.startsWith('http') ? url : `https:${url}`;

// ✅ Complex business logic
// Calculate caffeine absorption using Michaelis-Menten kinetics
// Half-life: ~5 hours, but varies by individual metabolism
const remainingCaffeine = calculateDecay(initial, hoursElapsed);

// ❌ Obvious comments
// Get the blog post
const blog = await getBlog(slug);
```

### Documentation Comments

```typescript
/**
 * Creates standardized metadata for blog posts
 *
 * @param options - Metadata options including title, description, and image
 * @returns Next.js Metadata object with OpenGraph and Twitter Card tags
 */
export function createBlogMetadata(options: MetadataOptions): Metadata {
  // ...
}
```

## Testing

### Manual Testing Checklist

Before committing:

```bash
# 1. TypeScript compilation
npx tsc --noEmit

# 2. Linting
npm run lint

# 3. Build (if significant changes)
npm run build

# 4. Format check
npm run format
```

## Git Commits

### Commit Messages

```bash
# ✅ Good: Clear, descriptive
feat: add JSON-LD structured data to blog posts
fix: handle null image URLs in metadata helper
refactor: extract rich-text rendering to shared utility
docs: update revalidation API documentation

# ❌ Bad: Vague
updated files
fix bug
changes
```

### Commit Structure

```bash
# 1. Type: feat, fix, refactor, docs, style, test, chore
# 2. Scope (optional): area of change
# 3. Description: what changed

feat(blog): add pagination to blog index
fix(api): handle missing slug in revalidation webhook
refactor(lib): consolidate metadata generation helpers
```

## Code Review Checklist

Before submitting code:

- [ ] TypeScript compiles without errors
- [ ] No `any` types used
- [ ] Consistent naming conventions
- [ ] Proper error handling
- [ ] No duplicate code
- [ ] Comments explain complex logic
- [ ] Imports organized correctly
- [ ] Constants extracted from magic numbers
- [ ] Functions have single responsibility
- [ ] Types properly defined
- [ ] Cache tags added where needed
- [ ] Documentation updated if patterns changed

## Anti-Patterns to Avoid

### 1. Prop Drilling

```typescript
// ❌ Bad: Passing props through many layers
<Parent blog={blog} />
  <Child blog={blog} />
    <GrandChild blog={blog} />

// ✅ Good: Fetch data where needed (Server Components)
<Parent>
  <Child>
    <GrandChild slug={slug} />  // Fetches own data
  </Child>
</Parent>
```

### 2. Client-Side Data Fetching

```typescript
// ❌ Bad: useEffect for data fetching
'use client';
export function BlogList() {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    fetch('/api/blogs').then(r => r.json()).then(setBlogs);
  }, []);
}

// ✅ Good: Server Component
export async function BlogList() {
  const blogs = await getAllBlogs();
  return <BlogGrid blogs={blogs} />;
}
```

### 3. Inline Styles

```typescript
// ❌ Bad: Inline styles
<div style={{ marginTop: '20px', color: '#333' }}>

// ✅ Good: Tailwind classes
<div className="mt-5 text-gray-700">
```

### 4. Magic Numbers

```typescript
// ❌ Bad: Magic numbers
const pages = Math.ceil(total / 9);
if (items.length > 1200) { /* ... */ }

// ✅ Good: Named constants
const pages = Math.ceil(total / POSTS_PER_PAGE);
if (imageWidth > OG_IMAGE_WIDTH) { /* ... */ }
```

## Performance Best Practices

### 1. Memoization (Client Components Only)

```typescript
'use client';

import { useMemo } from 'react';

export function ExpensiveComponent({ data }: Props) {
  const processed = useMemo(() => {
    return expensiveOperation(data);
  }, [data]);

  return <div>{processed}</div>;
}
```

### 2. Dynamic Imports

```typescript
// ✅ Code split large components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./heavy-chart'), {
  loading: () => <Spinner />,
  ssr: false,
});
```

### 3. Image Optimization

```typescript
// ✅ Always use Next.js Image
import Image from 'next/image';

<Image
  src={blog.heroImage.url}
  alt={blog.title}
  width={1200}
  height={630}
  priority={isFeatured}
/>
```
