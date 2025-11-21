# Technology Stack Decisions

## Core Framework

### Next.js 15 (App Router)

**Why**: Modern React framework with Server Components, Edge Runtime, and built-in optimizations

**Use For**:
- ✅ Page routing
- ✅ API routes
- ✅ Static generation
- ✅ Image optimization
- ✅ Metadata management

**Don't Use**:
- ❌ Pages Router patterns (use App Router)
- ❌ Client-side routing (use Link component)

## Content Management

### Contentful (Headless CMS)

**Why**: Flexible content modeling, GraphQL API, webhook support

**Use For**:
- ✅ Blog posts
- ✅ Dynamic pages
- ✅ Categories
- ✅ Countries data
- ✅ Coffee collection

**Patterns**:
```typescript
// Always use fetchGraphQL wrapper
const data = await fetchGraphQL(query, ['tag1', 'tag2']);

// Always provide cache tags
['blogPosts', slug]  // Collection + specific item
```

**Don't**:
- ❌ Direct fetch to Contentful API
- ❌ REST API (use GraphQL)
- ❌ Client-side fetching

## Database

### Neon (Serverless PostgreSQL)

**Why**: Serverless, auto-scaling, branch-per-preview

**Use For**:
- ✅ Habit tracking (coffee, running, body metrics)
- ✅ Daily goals and progress
- ✅ Time-series data
- ✅ User-generated data

**Patterns**:
```typescript
// Use template literals for parameterization
const rows = await sql`
  SELECT * FROM table WHERE id = ${id}
`;

// Validate with Zod
return ZSchema.parse(rows);
```

**Don't**:
- ❌ String interpolation
- ❌ Unvalidated responses
- ❌ ORM (use raw SQL)

## Search

### Algolia

**Why**: Fast, typo-tolerant search with analytics

**Use For**:
- ✅ Blog post search
- ✅ Search analytics
- ✅ Search suggestions

**Patterns**:
```typescript
// Index updates via webhook
await algoliaClient.addOrUpdateObject({
  indexName: env.ALGOLIA_INDEX,
  objectID: post.sys.id,
  body: { /* searchable fields */ },
});

// Search via API route (server-side)
const { hits } = await client.search({ query });
```

**Don't**:
- ❌ Client-side indexing
- ❌ Manual index management
- ❌ Expose admin key to client

## Styling

### Tailwind CSS

**Why**: Utility-first, no CSS files, tree-shakeable

**Use For**:
- ✅ All styling
- ✅ Responsive design
- ✅ Dark mode
- ✅ Custom design tokens

**Patterns**:
```typescript
// Group by concern
<div className="
  flex flex-col items-center    // Layout
  px-4 py-8                      // Spacing
  bg-white dark:bg-slate-800    // Colors
  rounded-lg shadow-md          // Effects
">
```

**Don't**:
- ❌ CSS files
- ❌ CSS-in-JS libraries
- ❌ Inline styles

### Tremor (Dashboard Components)

**Why**: Pre-built charts and KPI components

**Use For**:
- ✅ Dashboard charts
- ✅ KPI cards
- ✅ Data visualization

**Don't**:
- ❌ General UI components (use custom)
- ❌ Public-facing pages

## UI Components

### Headless UI

**Why**: Unstyled, accessible components

**Use For**:
- ✅ Modals
- ✅ Dropdowns
- ✅ Transitions
- ✅ Accessible patterns

**Don't**:
- ❌ Styled component libraries
- ❌ Heavy UI frameworks

## Validation

### Zod

**Why**: Type-safe schema validation with TypeScript inference

**Use For**:
- ✅ API request validation
- ✅ Environment variables
- ✅ Database response validation
- ✅ Form validation

**Patterns**:
```typescript
// Define schema, infer type
const ZInput = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
});

type Input = z.infer<typeof ZInput>;

// Validate
const result = ZInput.safeParse(input);
if (!result.success) {
  return error(result.error);
}
```

**Don't**:
- ❌ Manual validation
- ❌ Separate type definitions
- ❌ Runtime checks without schemas

## State Management

### React Server State (Recommended)

**Why**: No state management library needed with Server Components

**Use For**:
- ✅ Most data (fetch in Server Components)
- ✅ URL state (search params)
- ✅ Server actions

**Patterns**:
```typescript
// Server Component - no state needed
export default async function Page() {
  const data = await fetchData();
  return <Component data={data} />;
}
```

### useState (Client Components Only)

**Use For**:
- ✅ Form inputs
- ✅ UI state (modals, dropdowns)
- ✅ Local component state

**Don't**:
- ❌ Data fetching state
- ❌ Global state
- ❌ Complex state (consider useReducer)

## Caching

### Next.js Cache Tags

**Why**: Built-in, webhook-based revalidation

**Use For**:
- ✅ All cached data
- ✅ Contentful content
- ✅ Database queries

**Patterns**:
```typescript
// Tag data during fetch
fetch(url, { next: { tags: ['collection', 'item'] } });

// Revalidate on webhook
revalidateTag('collection');
revalidatePath('/path');
```

**Don't**:
- ❌ Redis for caching (use for rate limiting only)
- ❌ Manual cache management
- ❌ Multiple caching systems

## Rate Limiting

### Vercel KV (Redis)

**Why**: Built-in rate limiting with Redis

**Use For**:
- ✅ API rate limiting
- ✅ IP-based throttling
- ✅ Request tracking

**Patterns**:
```typescript
const rl = await rateLimit(req, "endpoint", {
  windowSec: 60,
  max: 10,
});

if (!rl.ok) {
  return error('Too many requests', 429);
}
```

**Don't**:
- ❌ Application data (use Neon)
- ❌ Session storage
- ❌ General caching (use Next.js)

## Authentication

### Header-Based (Current)

**Why**: Simple, suitable for webhooks and internal APIs

**Use For**:
- ✅ Contentful webhooks
- ✅ Admin API routes
- ✅ Protected endpoints

**Patterns**:
```typescript
// Check secret
if (!hasValidSecret(request)) {
  return error('Unauthorized', 401);
}

// Or throw
assertSecret(request);
```

**Future**: Consider adding user auth (NextAuth.js) if needed

## Monitoring

### Vercel Analytics

**Why**: Built-in, zero config

**Use For**:
- ✅ Page views
- ✅ Web vitals
- ✅ Speed insights

### Console Logs

**Use For**:
- ✅ Error logging
- ✅ Debug information
- ✅ Webhook activity

**Patterns**:
```typescript
// Structured logging
console.log(JSON.stringify({
  event: 'revalidation',
  tags: ['blog'],
  timestamp: Date.now(),
}));
```

## Deployment

### Vercel

**Why**: Made for Next.js, edge network, zero config

**Use For**:
- ✅ Production deployment
- ✅ Preview deployments
- ✅ Edge functions
- ✅ Environment variables

**Configuration**:
- Edge runtime for API routes
- Static generation for pages
- Environment variables in dashboard

## Development Tools

### TypeScript

**Version**: Latest stable

**Config**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### ESLint

**Use For**:
- ✅ Code quality
- ✅ React best practices
- ✅ Next.js patterns

### Prettier

**Use For**:
- ✅ Code formatting
- ✅ Consistency

**Run**:
```bash
npm run format      # Check
npm run format:fix  # Fix
```

## When to Add Dependencies

### ✅ Add When:
- Solves a real problem
- Well-maintained (recent commits)
- TypeScript support
- Small bundle size
- No suitable alternative exists

### ❌ Don't Add When:
- Can implement in <50 lines
- Duplicates existing functionality
- Large bundle size
- Poor TypeScript support
- Unmaintained

### Before Adding:
1. Check if Next.js provides it built-in
2. Check if Tailwind can handle it
3. Check existing `package.json`
4. Consider bundle size impact
5. Verify TypeScript support

## Decision Matrix

| Need | Technology | Why |
|------|-----------|-----|
| **Pages** | Next.js App Router | Server Components, SSG |
| **API** | Next.js API Routes | Edge runtime, co-located |
| **Styling** | Tailwind CSS | Utility-first, no CSS files |
| **CMS** | Contentful | Headless, GraphQL, webhooks |
| **Database** | Neon PostgreSQL | Serverless, auto-scaling |
| **Search** | Algolia | Fast, typo-tolerant |
| **Validation** | Zod | Type-safe, infers types |
| **Cache** | Next.js Cache Tags | Built-in, webhook-based |
| **Rate Limit** | Vercel KV | Redis-based, simple |
| **Deployment** | Vercel | Zero-config, Edge network |
| **Charts** | Tremor | Pre-built, beautiful |
| **Icons** | Heroicons | SVG, tree-shakeable |
| **Forms** | Native + Zod | No library needed |
| **State** | Server Components | No library needed |

## Version Requirements

```json
{
  "node": ">=24.0.0",
  "next": "15.x",
  "react": "19.x",
  "typescript": "5.9.x"
}
```

## AI & Machine Learning

### Transformers.js

**Why**: Run ML models locally in Node.js without external API dependencies

**Use For**:
- ✅ LLM text generation (Qwen3 0.6B)
- ✅ Embedding generation (all-MiniLM-L6-v2)
- ✅ RAG context retrieval

**Patterns**:
```typescript
// Text generation
import { pipeline } from "@huggingface/transformers";
const generator = await pipeline("text-generation", "onnx-community/Qwen3-0.6B-ONNX");

// Embeddings
const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
```

**Don't**:
- ❌ Client-side model loading (too slow)
- ❌ Models larger than 1GB (too slow for serverless)
- ❌ Streaming (not yet supported well)

### pgvector

**Why**: Vector similarity search in PostgreSQL

**Use For**:
- ✅ Storing embeddings
- ✅ Semantic search
- ✅ RAG retrieval

**Patterns**:
```typescript
// Store embedding
await sql`INSERT INTO chat_embeddings (content, embedding) VALUES (${text}, ${vector})`;

// Search similar
await sql`SELECT * FROM chat_embeddings ORDER BY embedding <=> ${queryVector} LIMIT 5`;
```

## Migration Notes

### Future Considerations:

- **User Authentication**: NextAuth.js when needed
- **Real-time Features**: Vercel AI SDK if needed
- **File Uploads**: Vercel Blob if needed
- **Payments**: Stripe if monetization needed

### Don't Migrate:

- ❌ Pages Router → App Router (already on App Router)
- ❌ CSS → Tailwind (already using Tailwind)
- ❌ REST → GraphQL for Contentful (already GraphQL)
