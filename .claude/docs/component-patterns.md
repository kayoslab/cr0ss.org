# Component Patterns

## Overview

This document defines patterns for React components in the cr0ss.org codebase. The project uses Next.js 14 App Router with React Server Components as the default.

## Core Principles

1. **Server Components by Default** - Only mark components as Client Components when needed
2. **Composition over Inheritance** - Build complex UIs from simple components
3. **Single Responsibility** - Each component should do one thing well
4. **Type Safety** - All props must be properly typed
5. **Presentational Components** - Keep components focused on rendering, not data fetching

## Server vs Client Components

### When to Use Server Components (Default)

```typescript
// ✅ Server Component (default)
// - Data fetching
// - Database queries
// - Content rendering
// - SEO metadata

export default async function BlogPage({ params }: Props) {
  const blog = await getBlog(params.slug);
  return <BlogArticle blog={blog} />;
}
```

**Use Server Components For**:
- ✅ Fetching data from databases or APIs
- ✅ Accessing backend resources directly
- ✅ Keeping sensitive information on server (API keys, tokens)
- ✅ Reducing client-side JavaScript
- ✅ Static content rendering

### When to Use Client Components

```typescript
// ✅ Client Component (explicit 'use client')
// - Interactive elements
// - Browser APIs
// - React hooks (useState, useEffect)
// - Event handlers
'use client';

import { useState } from 'react';

export function SearchBar() {
  const [query, setQuery] = useState('');

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

**Use Client Components For**:
- ✅ Interactive UI elements (forms, buttons with state)
- ✅ Event listeners (onClick, onChange, etc.)
- ✅ Browser APIs (localStorage, navigator, window)
- ✅ React hooks (useState, useEffect, useContext)
- ✅ Custom hooks that use client hooks

### Client Component Boundaries

```typescript
// ✅ Good: Client component wraps only interactive part
export default async function BlogPage({ params }: Props) {
  const blog = await getBlog(params.slug);  // Server-side data fetch

  return (
    <div>
      <BlogArticle blog={blog} />  {/* Server Component */}
      <CommentForm slug={params.slug} />  {/* Client Component */}
    </div>
  );
}

// ❌ Bad: Entire page is client component
'use client';
export default function BlogPage({ params }: Props) {
  const [blog, setBlog] = useState(null);

  useEffect(() => {
    fetch(`/api/blog/${params.slug}`).then(/* ... */);
  }, [params.slug]);

  return <BlogArticle blog={blog} />;
}
```

## File Naming & Organization

### File Names

```
components/
├── blog/
│   ├── blog-article.tsx       # ✅ kebab-case
│   ├── blog-card.tsx
│   ├── blog-grid.tsx
│   └── blog-hero.tsx
├── dashboard/
│   ├── coffee-chart.tsx
│   └── daily-overview.tsx
└── ui/
    ├── button.tsx
    └── modal.tsx
```

### Component Names

```typescript
// ✅ Good: PascalCase component names
export function BlogArticle({ blog }: Props) { }
export const BlogCard = ({ blog }: Props) => { };
export default function BlogGrid({ posts }: Props) { }

// ❌ Bad: Wrong casing
export function blogArticle() { }  // Should be PascalCase
export const blog_card = () => { };  // Should be PascalCase
```

## Component Structure

### Standard Component Template

```typescript
// 1. 'use client' directive (if needed)
'use client';

// 2. React & Next.js imports
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// 3. External library imports
import { Card } from '@tremor/react';

// 4. Internal imports (absolute paths with @/)
import { formatDate } from '@/lib/utils/date';
import type { BlogProps } from '@/lib/contentful/api/props/blog';

// 5. Type definitions
interface BlogCardProps {
  blog: BlogProps;
  featured?: boolean;
  onSelect?: (slug: string) => void;
}

// 6. Constants (if needed)
const CARD_STYLES = 'rounded-lg shadow-md hover:shadow-lg transition-shadow';

// 7. Helper functions (if small and specific to component)
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

// 8. Main component
export function BlogCard({ blog, featured = false, onSelect }: BlogCardProps) {
  // Component logic
  const truncatedSummary = truncateText(blog.summary, 150);

  return (
    <div className={featured ? `${CARD_STYLES} border-2 border-blue-500` : CARD_STYLES}>
      {/* Component JSX */}
    </div>
  );
}
```

## Props Patterns

### Props Interface Definition

```typescript
// ✅ Good: Props interface defined inline or nearby
interface BlogCardProps {
  blog: BlogProps;
  variant?: 'default' | 'compact' | 'featured';
  onSelect?: (slug: string) => void;
  className?: string;
}

export function BlogCard({ blog, variant = 'default', onSelect, className }: BlogCardProps) {
  // ...
}

// ✅ Also good: Imported types
import type { BlogProps } from '@/lib/contentful/api/props/blog';

interface Props {
  blogs: BlogProps[];
  category?: string;
}

export function BlogGrid({ blogs, category }: Props) {
  // ...
}
```

### Default Props

```typescript
// ✅ Good: Default values in destructuring
export function BlogCard({
  blog,
  featured = false,
  variant = 'default',
  className = ''
}: BlogCardProps) {
  // ...
}

// ❌ Bad: defaultProps (deprecated in function components)
BlogCard.defaultProps = {
  featured: false,
  variant: 'default',
};
```

### Optional Props

```typescript
interface Props {
  required: string;
  optional?: string;  // Optional
  nullableOptional?: string | null;  // Can be null or undefined
}

export function Component({ required, optional, nullableOptional }: Props) {
  return (
    <div>
      <p>{required}</p>
      {optional && <p>{optional}</p>}
      {nullableOptional !== null && nullableOptional !== undefined && (
        <p>{nullableOptional}</p>
      )}
    </div>
  );
}
```

### Children Props

```typescript
// ✅ Good: Explicit children type
interface Props {
  title: string;
  children: React.ReactNode;
}

export function Card({ title, children }: Props) {
  return (
    <div>
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}

// Usage
<Card title="My Card">
  <p>Content here</p>
</Card>
```

## State Management

### Client Component State

```typescript
'use client';

import { useState } from 'react';

export function SearchInput() {
  // ✅ Good: Descriptive state names
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const data = await fetch(`/api/search?q=${query}`);
      setResults(await data.json());
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={handleSearch} disabled={isSearching}>
        {isSearching ? 'Searching...' : 'Search'}
      </button>
    </div>
  );
}
```

### Complex State with useReducer

```typescript
'use client';

import { useReducer } from 'react';

type State = {
  items: Item[];
  filter: string;
  sort: 'asc' | 'desc';
  loading: boolean;
};

type Action =
  | { type: 'SET_ITEMS'; payload: Item[] }
  | { type: 'SET_FILTER'; payload: string }
  | { type: 'SET_SORT'; payload: 'asc' | 'desc' }
  | { type: 'SET_LOADING'; payload: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_SORT':
      return { ...state, sort: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function ItemList() {
  const [state, dispatch] = useReducer(reducer, {
    items: [],
    filter: '',
    sort: 'asc',
    loading: false,
  });

  // ...
}
```

### URL State (Server Components)

```typescript
// ✅ Good: Use URL search params for state in Server Components
export default async function BlogSearchPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const query = searchParams.q || '';
  const page = parseInt(searchParams.page || '1', 10);

  const results = await searchBlogs(query, page);

  return <SearchResults results={results} query={query} page={page} />;
}
```

## Data Fetching

### Server Component Data Fetching

```typescript
// ✅ Good: Async Server Component with data fetching
export default async function BlogPage({ params }: Props) {
  const blog = await getBlog(params.slug);

  if (!blog) {
    notFound();
  }

  return <BlogArticle blog={blog} />;
}

// ✅ Good: Parallel data fetching
export default async function DashboardPage() {
  const [stats, recentPosts, metrics] = await Promise.all([
    getStats(),
    getRecentPosts(),
    getMetrics(),
  ]);

  return (
    <Dashboard
      stats={stats}
      recentPosts={recentPosts}
      metrics={metrics}
    />
  );
}
```

### Client Component Data Fetching (Avoid When Possible)

```typescript
// ⚠️ Only when truly necessary (real-time data, user interactions)
'use client';

import { useState, useEffect } from 'react';

export function LiveStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const response = await fetch('/api/stats/live');
        if (!cancelled) {
          setStats(await response.json());
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchStats();

    // Cleanup
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Spinner />;
  return <StatsDisplay stats={stats} />;
}
```

## Composition Patterns

### Component Composition

```typescript
// ✅ Good: Small, composable components
export function BlogCard({ blog }: Props) {
  return (
    <article className="blog-card">
      <BlogCardImage image={blog.heroImage} />
      <BlogCardContent
        title={blog.title}
        summary={blog.summary}
        author={blog.author}
      />
      <BlogCardFooter
        date={blog.sys.firstPublishedAt}
        categories={blog.categoriesCollection.items}
      />
    </article>
  );
}

function BlogCardImage({ image }: { image: Asset }) {
  return (
    <div className="relative h-48 w-full">
      <Image
        src={image.url}
        alt={image.description || ''}
        fill
        className="object-cover"
      />
    </div>
  );
}

function BlogCardContent({ title, summary, author }: Props) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-gray-600">{summary}</p>
      <p className="text-sm text-gray-500">by {author}</p>
    </div>
  );
}

function BlogCardFooter({ date, categories }: Props) {
  return (
    <div className="flex items-center justify-between p-4">
      <time>{formatDate(date)}</time>
      <CategoryTags categories={categories} />
    </div>
  );
}
```

### Render Props Pattern (When Needed)

```typescript
interface DataLoaderProps<T> {
  fetch: () => Promise<T>;
  children: (data: T, loading: boolean, error: Error | null) => React.ReactNode;
}

export function DataLoader<T>({ fetch, children }: DataLoaderProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [fetch]);

  return <>{children(data!, loading, error)}</>;
}

// Usage
<DataLoader fetch={fetchStats}>
  {(data, loading, error) => {
    if (loading) return <Spinner />;
    if (error) return <Error error={error} />;
    return <StatsDisplay stats={data} />;
  }}
</DataLoader>
```

## Conditional Rendering

### Early Returns

```typescript
// ✅ Good: Early returns for error states
export function BlogArticle({ blog }: Props) {
  if (!blog) {
    return <NotFound />;
  }

  if (blog.draft) {
    return <DraftWarning />;
  }

  return (
    <article>
      <h1>{blog.title}</h1>
      <p>{blog.summary}</p>
    </article>
  );
}
```

### Ternary Operator

```typescript
// ✅ Good: Simple ternary for inline conditions
<div className={featured ? 'featured-card' : 'regular-card'}>
  {isLoading ? <Spinner /> : <Content />}
</div>

// ❌ Bad: Nested ternaries
<div>
  {isLoading ? <Spinner /> : error ? <Error /> : data ? <Content /> : null}
</div>

// ✅ Good: Nested conditions with early returns
if (isLoading) return <Spinner />;
if (error) return <Error />;
if (!data) return null;
return <Content />;
```

### Logical AND Operator

```typescript
// ✅ Good: Optional rendering
<div>
  {user && <UserProfile user={user} />}
  {posts.length > 0 && <PostsList posts={posts} />}
  {!loading && <Content />}
</div>

// ⚠️ Be careful with falsy values
<div>
  {count && <span>{count} items</span>}  {/* Won't show "0 items" */}
  {count > 0 && <span>{count} items</span>}  {/* ✅ Better */}
</div>
```

## Styling Patterns

### Tailwind Classes

```typescript
// ✅ Good: Semantic grouping, readable
<div className="
  flex flex-col items-center justify-between
  min-h-screen p-4 pb-24
  bg-white dark:bg-slate-800
  rounded-lg shadow-md
">

// ✅ Good: Dynamic classes with template literals
<div className={`
  base-class
  ${isActive ? 'active' : 'inactive'}
  ${size === 'large' ? 'text-2xl' : 'text-base'}
`}>

// ✅ Good: Conditional classes (if cn/clsx installed)
import { cn } from '@/lib/utils';

<div className={cn(
  'base-class',
  isActive && 'active',
  isPending && 'pending',
  className
)}>
```

### Component Variants

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const BUTTON_VARIANTS = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  danger: 'bg-red-500 text-white hover:bg-red-600',
};

const BUTTON_SIZES = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({ variant, size, children }: ButtonProps) {
  return (
    <button
      className={`
        ${BUTTON_VARIANTS[variant]}
        ${BUTTON_SIZES[size]}
        rounded font-medium transition-colors
      `}
    >
      {children}
    </button>
  );
}
```

## Performance Optimization

### React.memo (Client Components Only)

```typescript
'use client';

import { memo } from 'react';

// ✅ Good: Memoize expensive pure components
export const BlogCard = memo(function BlogCard({ blog }: Props) {
  return (
    <article>
      <h2>{blog.title}</h2>
      <p>{blog.summary}</p>
    </article>
  );
});

// Only use when:
// - Component is pure (same props = same output)
// - Component re-renders often
// - Re-rendering is expensive
```

### useMemo for Expensive Calculations

```typescript
'use client';

import { useMemo } from 'react';

export function BlogList({ blogs, filter }: Props) {
  // ✅ Good: Memoize expensive filtering/sorting
  const filteredBlogs = useMemo(() => {
    return blogs
      .filter(blog => blog.title.includes(filter))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [blogs, filter]);

  return (
    <div>
      {filteredBlogs.map(blog => <BlogCard key={blog.sys.id} blog={blog} />)}
    </div>
  );
}
```

### useCallback for Event Handlers

```typescript
'use client';

import { useCallback } from 'react';

export function BlogGrid({ blogs }: Props) {
  // ✅ Good: Stable callback reference
  const handleSelect = useCallback((slug: string) => {
    console.log('Selected:', slug);
    // ... navigation or state update
  }, []);

  return (
    <div>
      {blogs.map(blog => (
        <BlogCard
          key={blog.sys.id}
          blog={blog}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
```

### Dynamic Imports

```typescript
// ✅ Good: Code split heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./heavy-chart'), {
  loading: () => <Spinner />,
  ssr: false,  // Don't server-render if not needed
});

export function Dashboard() {
  return (
    <div>
      <Stats />
      <HeavyChart />
    </div>
  );
}
```

## Anti-Patterns

### ❌ Avoid

```typescript
// ❌ Bad: Entire app as Client Component
'use client';
export default function App() {
  const [data, setData] = useState(null);
  // This should be a Server Component!
}

// ❌ Bad: Fetching in useEffect when Server Component would work
'use client';
export function BlogList() {
  const [blogs, setBlogs] = useState([]);
  useEffect(() => {
    fetch('/api/blogs').then(r => r.json()).then(setBlogs);
  }, []);
  // Just use a Server Component!
}

// ❌ Bad: Prop drilling
<Parent data={data}>
  <Child data={data}>
    <GrandChild data={data}>
      <GreatGrandChild data={data} />

// ❌ Bad: Inline functions in render
{blogs.map(blog => (
  <BlogCard
    blog={blog}
    onSelect={() => handleSelect(blog.slug)}  // New function every render!
  />
))}

// ❌ Bad: Using any type
interface Props {
  data: any;  // Don't do this!
}

// ❌ Bad: Inline styles
<div style={{ marginTop: '20px', color: '#333' }}>

// ❌ Bad: Not handling loading/error states
export function Component() {
  const [data, setData] = useState(null);
  return <Display data={data} />;  // What if data is null?
}
```

## Component Checklist

Before committing a component:

- [ ] Server Component by default (only use `'use client'` when needed)
- [ ] Props interface properly typed (no `any`)
- [ ] Default values for optional props
- [ ] Proper error handling and loading states
- [ ] Tailwind classes organized and readable
- [ ] Accessibility attributes (alt, aria-label, etc.)
- [ ] TypeScript compiles without errors
- [ ] No console warnings in development
- [ ] Component is focused (single responsibility)
- [ ] Reusable parts extracted to smaller components
