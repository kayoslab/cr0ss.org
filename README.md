# cr0ss.org

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kayoslab/cr0ss.org)

Personal and professional website of Simon Krüger, built with Next.js 16, TypeScript, and Contentful CMS. Features a blog, personal dashboard with habit tracking, caffeine metabolism modeling, travel map, and more.

🌐 **Live Site:** [cr0ss.org](https://cr0ss.org)

---

## ✨ Features

### 🎨 **Content Management**
- **Headless CMS** - Powered by [Contentful](https://www.contentful.com/)
- **Rich Text Rendering** - Custom renderer with syntax highlighting for code snippets
- **Dynamic Pages** - Slug-based routing with static generation
- **Smart Cache Invalidation** - Automatic revalidation via webhooks

### 📝 **Blog System**
- **Full-featured blog** with categories, tags, and pagination
- **Search powered by Algolia** - Fast, instant search with analytics
- **SEO Optimized** - Open Graph, Twitter Cards, JSON-LD structured data
- **RSS Feed** - Automatic feed generation at `/rss.xml`
- **Dynamic Sitemap** - Auto-generated sitemap with all content

### 📊 **Personal Dashboard**
- **Habit Tracking** - Coffee consumption, running, body metrics, writing goals
- **Caffeine Metabolism Modeling** - Real-time caffeine tracking with pharmacokinetic calculations
- **Interactive Charts** - Built with Tremor React and Recharts components
- **PostgreSQL Database** - Powered by Neon serverless Postgres
- **Rate-Limited API** - Secure endpoints with Redis-based rate limiting

### 🗺️ **Travel Map**
- **Interactive world map** - Visualize visited countries
- **Country tracking** - Contentful-managed country data
- **Dynamic visualization** - Real-time updates from CMS

### 🔍 **Search**
- **Algolia integration** - Lightning-fast search across all blog posts
- **Search analytics** - Track search queries and click-through rates
- **Keyboard navigation** - Full keyboard support for power users

### 🤖 **AI Chat Assistant**
- **RAG-powered** - Retrieval-Augmented Generation using knowledge base and blog content
- **Vercel AI Gateway** - Unified access to OpenAI, Anthropic, and other providers
- **Vector search** - pgvector for semantic similarity search
- **Provider switching** - Easy model switching via environment variables
- **Auto-indexed** - Content automatically indexed on Contentful webhooks

---

## 🛠️ Tech Stack

### **Core**
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[TypeScript 6](https://www.typescriptlang.org/)** - Type-safe development with strict mode
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[React 19](https://react.dev/)** - Latest React with Server Components

### **Content & Data**
- **[Contentful](https://www.contentful.com/)** - Headless CMS for content management
- **[Neon](https://neon.tech/)** - Serverless PostgreSQL database with pgvector
- **[Upstash Redis](https://upstash.com/)** (via Vercel Marketplace) - Redis for rate limiting
- **[Algolia](https://www.algolia.com/)** - Search and analytics

### **AI & Machine Learning**
- **[Vercel AI Gateway](https://vercel.com/ai-gateway)** - Unified access to OpenAI, Anthropic, etc.
- **[Vercel AI SDK](https://ai-sdk.dev/)** - TypeScript toolkit for AI applications
- **[pgvector](https://github.com/pgvector/pgvector)** - Vector similarity search
- **text-embedding-3-small** - OpenAI embedding model (384 dimensions)

### **UI Components**
- **[Tremor](https://www.tremor.so/)** - Dashboard and chart components
- **[Headless UI](https://headlessui.com/)** - Accessible UI primitives
- **[Heroicons](https://heroicons.com/)** - Beautiful SVG icons
- **[React Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)** - Code syntax highlighting

### **Developer Tools**
- **[Zod 4](https://zod.dev/)** - Runtime type validation and schema parsing
- **[T3 Env](https://env.t3.gg/)** - Type-safe environment variables
- **[Prettier](https://prettier.io/)** - Code formatting with Tailwind plugin
- **[ESLint 9](https://eslint.org/)** - Linting with flat config
- **[Vitest](https://vitest.dev/)** - Fast, modern test runner with native TypeScript support
- **[Testing Library](https://testing-library.com/)** - User-centric component testing
- **[MSW 2](https://mswjs.io/)** - API mocking at network level for tests

### **Deployment & Analytics**
- **[Vercel](https://vercel.com/)** - Deployment and hosting
- **[Vercel Analytics](https://vercel.com/analytics)** - Web analytics
- **[Vercel Speed Insights](https://vercel.com/docs/speed-insights)** - Performance monitoring

---

## 📁 Project Structure

```
cr0ss.org/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── revalidate/          # Cache invalidation webhook
│   │   ├── algolia/             # Search API
│   │   ├── dashboard/           # Dashboard data API
│   │   └── habits/              # Habit tracking endpoints
│   ├── blog/                    # Blog routes
│   │   ├── [slug]/             # Individual blog posts
│   │   ├── category/[slug]/    # Category pages
│   │   └── search/             # Search results
│   ├── chat/                    # AI chat assistant
│   ├── dashboard/               # Personal dashboard
│   ├── page/[slug]/            # Dynamic Contentful pages
│   ├── rss.xml/                # RSS feed generation
│   └── sitemap.tsx             # Dynamic sitemap
│
├── components/                  # React components
│   ├── blog/                   # Blog-specific components
│   ├── chat/                   # AI chat components
│   ├── dashboard/              # Dashboard components
│   ├── page/                   # Page rendering components
│   ├── search/                 # Search UI components
│   └── ui/                     # Shared UI components
│
├── lib/                         # Utility libraries
│   ├── ai/                     # AI chat (LLM, embeddings, RAG)
│   ├── api/                    # API utilities and middleware
│   ├── auth/                   # Authentication helpers
│   ├── cache/                  # Cache management
│   ├── contentful/             # Contentful API integration
│   │   ├── api/               # Content fetching functions
│   │   └── rich-text-renderer.tsx  # Rich text rendering
│   ├── db/                     # Database queries and models
│   ├── algolia/                # Algolia integration
│   ├── phys/                   # Physics models
│   │   └── caffeine.tsx       # Pharmacokinetic caffeine modeling
│   ├── map/                    # Geographic utilities
│   │   └── centroid.ts        # Polygon centroid calculations
│   ├── rate/                   # Rate limiting
│   ├── time/                   # Timezone utilities (Berlin timezone)
│   ├── user/                   # User profile types
│   ├── constants.ts            # Shared constants
│   ├── metadata.ts             # SEO metadata helpers
│   └── validation.tsx          # Zod validation schemas
│
├── hooks/                       # Custom React hooks
├── test/                        # Test utilities and configuration
│   ├── setup.ts                # Vitest global setup
│   ├── utils.tsx               # Test helpers (render, etc.)
│   └── mocks/                  # MSW mock handlers
├── .claude/                     # AI agent documentation
│   ├── README.md               # Project context for Claude
│   └── docs/                   # Detailed documentation
├── docs/                        # Documentation
│   └── REVALIDATION.md         # Cache revalidation guide
├── db/migrations/               # Database migration scripts
└── public/                      # Static assets
```

---

## 🚀 Getting Started

### **Prerequisites**

- Node.js 24+ (tested on v24.9.0)
- pnpm 10+ (package manager - tested on v10.18.0)
- Contentful account
- Vercel account (for deployment)
- Neon database (for habits tracking)
- Algolia account (for search)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/kayoslab/cr0ss.org.git
   cd cr0ss.org
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create `.env.local` file with the following variables:

   ```bash
   # Contentful
   CONTENTFUL_SPACE_ID=your_space_id
   CONTENTFUL_ACCESS_TOKEN=your_access_token
   CONTENTFUL_ENVIRONMENT=master
   CONTENTFUL_PREVIEW_ACCESS_TOKEN=your_preview_token
   CONTENTFUL_MANAGEMENT_TOKEN=your_management_token
   CONTENTFUL_REVALIDATE_SECRET=your_webhook_secret  # Used for all Contentful webhooks

   # Database (Neon)
   DATABASE_URL=your_postgres_connection_string

   # Algolia
   ALGOLIA_APP_ID=your_app_id
   ALGOLIA_ADMIN_KEY=your_admin_key
   ALGOLIA_SEARCH_KEY=your_search_key
   ALGOLIA_INDEX=your_index_name

   # API Secrets
   DASHBOARD_API_SECRET=your_dashboard_secret

   # AI (Vercel AI Gateway)
   AI_GATEWAY_API_KEY=your_ai_gateway_key

   # Vercel KV (Redis)
   KV_REST_API_URL=your_kv_url
   KV_REST_API_TOKEN=your_kv_token

   # Public URL
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Run database migrations** (if using habits tracking)
   ```bash
   psql $DATABASE_URL < db/migrations/001_init.sql
   psql $DATABASE_URL < db/migrations/002_rituals_steps_journaled.sql
   # ... run remaining migrations
   ```

5. **Set up Contentful** (optional)
   ```bash
   pnpm setup
   ```
   This will create the necessary content types in Contentful.

6. **Run the development server**
   ```bash
   pnpm dev
   ```

7. **Open [http://localhost:3000](http://localhost:3000)**

---

## 📝 Content Types

### **Blog Post** (`blogPost`)
```typescript
{
  title: string;
  slug: string;
  author: string;
  summary: string;
  heroImage: Asset;
  details: RichText;
  categoriesCollection: Category[];
  seoDescription: string;
  seoKeywords: string[];
}
```

### **Page** (`page`)
```typescript
{
  title: string;
  slug: string;
  heroImage: Asset;
  details: RichText;
  date: Date;
}
```

### **Category** (`category`)
```typescript
{
  title: string;
  slug: string;
}
```

### **Country** (`country`)
```typescript
{
  id: string;
  name: string;
  iso2: string;
  iso3: string;
  lastVisited: Date;
}
```

### **Coffee** (`coffee`)
```typescript
{
  name: string;
  roaster: string;
  // ... additional fields
}
```

---

## 🔄 Cache Revalidation & Search Indexing

The project uses a unified webhook endpoint that handles both cache revalidation and search indexing. When content is published or updated in Contentful:

**Example: Publishing a blog post**
```
Contentful Publish → Webhook → /api/revalidate →
  ✅ Invalidates cache:
    - Tag: blogPosts
    - Tag: {slug}
    - Path: /blog
    - Path: /blog/{slug}
  ✅ Updates Algolia search index automatically
```

A single `CONTENTFUL_REVALIDATE_SECRET` is used for all Contentful webhook operations.

See [docs/REVALIDATION.md](docs/REVALIDATION.md) for complete documentation.

---

## 🎨 Styling

### **Tailwind Configuration**

The project uses Tailwind CSS with custom configuration:

- **Dark mode** - Class-based dark mode support
- **Custom colors** - Extended color palette
- **Typography plugin** - Enhanced prose styling
- **Custom fonts** - Inter font via `next/font`

### **Component Library**

- **Tremor** - Dashboard charts and KPI cards
- **Headless UI** - Modals, dropdowns, transitions
- **Custom components** - Blog cards, navigation, search

---

## 🔐 API Endpoints

### **Public Endpoints**

- `GET /api/algolia/search` - Search blog posts
- `GET /rss.xml` - RSS feed
- `GET /sitemap.xml` - Dynamic sitemap

### **Webhook Endpoints** (require `x-vercel-revalidation-key` header)

- `POST /api/revalidate` - Cache invalidation + search indexing webhook (Contentful)

### **Protected Endpoints** (require `x-admin-secret` header)

- `GET /api/dashboard` - Dashboard data
- `GET /api/habits/day?date=YYYY-MM-DD` - Get daily habits (defaults to today)
- `POST /api/habits/day` - Update daily habits (partial updates supported, returns full day data)
- `POST /api/habits/coffee` - Log coffee consumption
- `POST /api/habits/run` - Log running activities
- `POST /api/habits/body` - Log body metrics
- `POST /api/habits/goal` - Update goals

### **Rate Limiting**

All API endpoints are rate-limited using Redis (Vercel KV):

- Default: 10 requests per 60 seconds per IP
- Configurable per endpoint
- Returns `429 Too Many Requests` when exceeded

---

## 📊 SEO Features

### **Metadata**

- ✅ **Open Graph tags** - Rich previews on social media
- ✅ **Twitter Cards** - Enhanced Twitter sharing
- ✅ **JSON-LD structured data** - Schema.org for articles
- ✅ **Dynamic titles and descriptions** - Per-page optimization
- ✅ **Canonical URLs** - Proper URL canonicalization

### **Sitemap & RSS**

- ✅ **Dynamic sitemap** - Auto-generated with all content
- ✅ **RSS feed** - Full-text blog feed
- ✅ **Priority and change frequency** - Optimized for crawlers

### **Performance**

- ✅ **Static generation** - Pre-rendered at build time
- ✅ **Image optimization** - Next.js Image component
- ✅ **Code splitting** - Automatic route-based splitting
- ✅ **Edge runtime** - Fast API responses

---

## 🧪 Development

### **Scripts**

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server

# Code Quality
pnpm lint         # Run ESLint
pnpm format       # Check code formatting
pnpm format:fix   # Fix code formatting

# Testing
pnpm test              # Run all tests
pnpm test:watch        # Run tests in watch mode
pnpm test:ui           # Run tests with UI
pnpm test:coverage     # Generate coverage report
pnpm test:coverage:ui  # View coverage report in UI
pnpm test:changed      # Run tests for changed files
pnpm test:ci           # Run tests in CI mode with coverage

# Contentful
pnpm setup        # Set up Contentful content types

# AI Chat
pnpm ai:download  # Download LLM models (runs automatically in prebuild)
pnpm ai:index     # Index content for RAG (runs automatically in postbuild)
pnpm ai:setup     # Set up pgvector database table
```

### **TypeScript**

The project uses strict TypeScript with:

- Path aliases (`@/*` → project root)
- Strict null checks
- No implicit any
- Custom type definitions for Contentful content

### **Code Style**

- **Prettier** - Consistent code formatting
- **ESLint** - Catch common errors
- **Component naming** - PascalCase for components, kebab-case for files

### **Testing**

The project uses [Vitest](https://vitest.dev/) and [Testing Library](https://testing-library.com/) for comprehensive test coverage:

#### **Test Structure**
```
├── lib/                    # Business logic tests
│   ├── phys/
│   │   ├── caffeine.ts
│   │   └── caffeine.test.ts
│   ├── time/
│   │   ├── berlin.tsx
│   │   └── berlin.test.ts
│   └── db/
│       ├── validation.tsx
│       └── validation.test.ts
├── app/api/               # API route tests
│   ├── auth/check/
│   │   ├── route.tsx
│   │   └── route.test.ts
│   └── location/
│       ├── route.ts
│       └── route.test.ts
├── components/            # Component tests
│   └── dashboard/
│       ├── Section.tsx
│       └── Section.test.tsx
└── test/                  # Test utilities
    ├── setup.ts          # Global test configuration
    ├── utils.tsx         # Test helpers
    └── mocks/            # MSW handlers
        ├── handlers.ts   # API mocks
        └── server.ts     # Mock server setup
```

#### **Current Test Suite**
- **7 test files** with **132 passing tests**
- Tests co-located with source files (e.g., `caffeine.test.ts` next to `caffeine.tsx`)
- MSW for API mocking at network level
- jsdom environment for React component testing

#### **Coverage Goals & Per-File Thresholds**
The project uses per-file coverage thresholds instead of global ones to maintain high quality on tested code while allowing gradual expansion:

- **`lib/phys/caffeine.tsx`**: 80% branches, 100% functions/lines/statements
- **`lib/time/berlin.tsx`**: 82% branches, 90-94% other metrics
- **`lib/map/centroid.ts`**: 60% (core functions tested)
- **`lib/db/validation.tsx`**: 90% all metrics
- **API routes**: 70-80% coverage

#### **What's Tested**
- ✅ **Core business logic** - Caffeine metabolism modeling (34 tests), timezone utilities (16 tests), data validation (24 tests)
- ✅ **Geographic calculations** - Polygon centroids and area calculations (24 tests)
- ✅ **API routes** - Authentication (4 tests), location tracking (21 tests)
- ✅ **React components** - Dashboard sections (9 tests)
- ✅ **Integration tests** - External API mocking (Contentful, Algolia, Vercel KV) via MSW

#### **Running Tests**

```bash
# Run all tests
pnpm test

# Watch mode (re-run on changes)
pnpm test:watch

# Coverage report
pnpm test:coverage

# View coverage in browser
pnpm test:coverage:ui
```

#### **CI/CD**

Tests run automatically on every push and pull request via GitHub Actions:
- ✅ **TypeScript type checking** (`pnpm tsc --noEmit`)
- ✅ **ESLint validation** (`pnpm lint`)
- ✅ **Full test suite** with coverage reporting (`pnpm test:ci`)
- ✅ **Build verification** (`pnpm build`)
- ✅ **Codecov integration** - Coverage reports uploaded to Codecov

The workflow uses the **Production environment** for secrets and runs on **Node.js 20** with **pnpm 10**.

See `.github/workflows/test.yml` for the complete CI configuration.

---

## 🚀 Deployment

### **Vercel (Recommended)**

1. Push code to GitHub
2. Import repository to Vercel
3. Configure environment variables
4. Deploy

Vercel will automatically:
- Build on push
- Deploy to production on `main` branch
- Create preview deployments for pull requests

### **Environment Variables**

Make sure to configure all required environment variables in Vercel:
- Contentful credentials
- Database connection string
- Algolia API keys
- API secrets
- Vercel KV credentials

### **Database Setup**

Run migrations against your production database:

```bash
psql $DATABASE_URL < db/migrations/*.sql
```

---

## 📖 Documentation

- [AI Chat Assistant](docs/ai-chat.md) - RAG-powered chat implementation
- [Revalidation API](docs/REVALIDATION.md) - Cache invalidation guide
- [Contentful Setup](lib/contentful/setup.ts) - Content type definitions
- [API Middleware](lib/api/middleware.ts) - API utilities

---

## 🤝 Contributing

This is a personal project, but suggestions and bug reports are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary.

---

## 👤 Author

**Simon Krüger**

- Website: [cr0ss.org](https://cr0ss.org)
- GitHub: [@kayoslab](https://github.com/kayoslab)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Vercel](https://vercel.com/) - Deployment and hosting
- [Contentful](https://www.contentful.com/) - Headless CMS
- [Algolia](https://www.algolia.com/) - Search platform
- [Tremor](https://www.tremor.so/) - Dashboard components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

## 📈 Performance

- **Lighthouse Score**: 95+ across all metrics
- **First Contentful Paint**: < 1s
- **Time to Interactive**: < 2s
- **Static Generation**: All blog posts pre-rendered
- **Edge Runtime**: API routes on Vercel Edge Network

---

Built with ❤️ by Simon Krüger
