# cr0ss.org

Personal and professional website of Simon Krüger — a blog and portfolio backed by Contentful, a quantified-self dashboard backed by Neon Postgres, and a small contact-memory system behind the portfolio's NFC card.

🌐 **Live site:** [cr0ss.org](https://cr0ss.org)

---

## What's here

**Content (Contentful)**

- Blog with categories, Algolia search and recommendations, RSS, sitemap, Open Graph and JSON-LD.
- Portfolio of projects, plus free-form pages (`/page/[slug]`).
- Coffee journal with origin maps.
- A Contentful webhook (`POST /api/revalidate`) invalidates the cache and re-indexes Algolia on publish.

**Dashboard (Neon Postgres)**

- Habits, coffee and caffeine (pharmacokinetic model), workouts and running (Strava sync), travel map and current location with weather, and a correlation engine that finds statistically significant relationships between the daily metrics.
- Data is logged from Shortcuts/automations through the secret-gated write endpoints under `/api/habits/*`; the pages read the same data directly.

**Contact memory (NFC card → WhatsApp)**

- `/portfolio?campaign-id=…` shows a capture form. Submissions are stored, a [Vercel Workflow](https://vercel.com/docs/workflow) enriches the profile via Apify in the background, and an embedding goes into pgvector.
- A private MCP server (`/api/mcp`) exposes semantic recall over those contacts to an [eve](https://eve.dev) agent (see [`eve/README.md`](eve/README.md)).

---

## Stack

|                 |                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework       | [Next.js 16](https://nextjs.org/) App Router with **Cache Components** (`'use cache'`), React 19, TypeScript 6                                                                       |
| Styling         | Tailwind CSS 4 (CSS-first config), [shadcn/ui](https://ui.shadcn.com/) on Radix, Recharts, Lucide                                                                                    |
| Content         | [Contentful](https://www.contentful.com/) GraphQL, [Algolia](https://www.algolia.com/) search + Recommend                                                                            |
| Data            | [Neon](https://neon.tech/) Postgres with pgvector, [Upstash Redis](https://upstash.com/) (rate limiting)                                                                             |
| AI              | [AI SDK 7](https://ai-sdk.dev/) through [Vercel AI Gateway](https://vercel.com/ai-gateway) for embeddings; [mcp-handler](https://github.com/vercel/mcp-handler) for the MCP endpoint |
| Background work | Vercel Workflow (durable enrichment pipeline), Vercel Cron (fallback sweep)                                                                                                          |
| Validation      | Zod 4 everywhere, [T3 Env](https://env.t3.gg/) for environment variables                                                                                                             |
| Tooling         | Vitest 5 + Testing Library + MSW, Playwright, ESLint (flat config, typescript-eslint), Prettier                                                                                      |
| Hosting         | Vercel (Fluid Compute), config in [`vercel.ts`](vercel.ts), Analytics + Speed Insights                                                                                               |

---

## How it's put together

```
app/
├── (site)/            public site: home, blog, coffee, portfolio, page/[slug]  (Navigation + Footer)
├── dashboard/         quantified-self dashboard (own layout with sidebar)
├── api/
│   ├── v1/dashboard/  secret-gated reads, thin wrappers over lib/dashboard
│   ├── habits/…       secret-gated writes (Shortcuts, the settings page)
│   ├── revalidate/    Contentful webhook: cache tags + Algolia indexing
│   ├── capture/       portfolio contact capture → starts the enrichment workflow
│   ├── mcp/           MCP server for the eve agent
│   └── strava/        OAuth + webhook + sync
├── rss.xml/  sitemap.tsx
lib/
├── dashboard/         one module per domain (coffee, habits, workouts, goals, …);
│                      every read is a 'use cache' function tagged from the registry
├── cache/tags.ts      the single registry of cache tags + the invalidation set per event
├── cache/revalidate.ts revalidateX() helpers the write endpoints call
├── contentful/api/    GraphQL fetchers (fetchGraphQL is itself cached + tagged)
├── db/                Neon client, queries, Zod models
├── api/               route builder (auth, rate limit, trace) and response helpers
├── workflows/         enrich-contact workflow
├── ai/                embeddings via AI Gateway
└── phys/, time/, stats/, insights/   caffeine model, Berlin-time helpers, correlations
db/migrations/         numbered SQL migrations, applied with `pnpm db:migrate`
e2e/                   Playwright smoke tests
eve/                   the recall agent that talks to /api/mcp
```

**Caching model.** Pages are dynamic by default; data functions opt in with `'use cache'`, a `cacheLife` profile (`realtime` 1m · `frequent` 5m · `standard` 15m · `stable` 1h · `content` 1h, defined in `next.config.mjs`) and `cacheTag`s from `lib/cache/tags.ts`. Write endpoints call the matching `revalidateX()` so a logged coffee is visible on the next request; the Contentful webhook does the same for content. `lib/cache/tags.test.ts` asserts every invalidation set only names registered tags.

**API conventions.** Routes are built with `createApiRoute().withAuth().withRateLimit().withTrace().handle()`; errors are `{ error, details?, code? }`. Reads under `/api/v1` answer `Cache-Control: private, no-store` because they're secret-gated.

---

## Getting started

Prerequisites: Node 24+, pnpm 10 (`corepack enable`), and accounts for Contentful, Neon, Upstash (or the Vercel Marketplace equivalents) and Algolia.

```bash
git clone https://github.com/kayoslab/cr0ss.org.git && cd cr0ss.org
pnpm install
```

Create `.env.local` (validated at startup by [`env.ts`](env.ts); empty values count as unset):

```bash
# Contentful
CONTENTFUL_SPACE_ID=
CONTENTFUL_ACCESS_TOKEN=
CONTENTFUL_REVALIDATE_SECRET=     # shared secret for the publish webhook

# Neon + Upstash
DATABASE_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Algolia
ALGOLIA_APP_ID=
ALGOLIA_ADMIN_KEY=
ALGOLIA_SEARCH_KEY=
ALGOLIA_INDEX=

# Dashboard write access (x-admin-secret header)
DASHBOARD_API_SECRET=

# Optional integrations
OPENWEATHER_API_KEY=              # weather with each logged location
AI_GATEWAY_API_KEY=               # contact embeddings
OWNER_WHATSAPP= APIFY_TOKEN= APIFY_ACTOR_ID= CRON_SECRET= MCP_BEARER_TOKEN=
STRAVA_CLIENT_ID= STRAVA_CLIENT_SECRET= STRAVA_WEBHOOK_VERIFY_TOKEN= TOKEN_ENCRYPTION_KEY=
```

Then:

```bash
pnpm db:migrate up      # apply db/migrations to DATABASE_URL (see below)
pnpm setup              # optional: create the Contentful content types
pnpm dev
```

### Database migrations

`db/migrations/NNN_name.sql` files are applied in order, each in its own transaction, and recorded in a `schema_migrations` table with a checksum.

```bash
pnpm db:migrate status     # applied / pending / changed-since-applied
pnpm db:migrate up         # apply pending files
pnpm db:migrate baseline   # existing database: record all files as applied without running them
```

Rehearse a migration on a [Neon branch](https://neon.tech/docs/introduction/branching) by pointing `DATABASE_URL` at it first.

---

## Scripts

```bash
pnpm dev / build / start
pnpm lint  ·  pnpm format  ·  pnpm format:fix
pnpm test  ·  pnpm test:watch  ·  pnpm test:coverage  ·  pnpm test:ci
pnpm e2e                    # Playwright smoke tests (builds first: pnpm build && pnpm e2e)
pnpm db:migrate <command>   # status | up | baseline
pnpm setup                  # Contentful content types
pnpm setup:portfolio        # seed portfolio projects in Contentful
```

CI (`.github/workflows/test.yml`) runs type-checking, ESLint, the unit tests with coverage, a production build and the Playwright smoke suite on Node 24.

---

## API

| Endpoint                                                  | Auth                                     | Purpose                                                                          |
| --------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------- |
| `GET /api/algolia/search?q=`                              | public, rate-limited                     | blog search + click tracking                                                     |
| `POST /api/algolia/analytics`                             | public                                   | view/click events for Algolia Recommend                                          |
| `GET /api/featured-posts`                                 | public                                   | trending posts (Algolia) with recent-posts fallback                              |
| `POST /api/capture`                                       | public, rate-limited, honeypot           | portfolio contact capture                                                        |
| `POST /api/revalidate`                                    | `x-vercel-revalidation-key`              | Contentful webhook: cache + Algolia                                              |
| `GET /api/v1/dashboard/*`                                 | `x-admin-secret`                         | dashboard reads (coffee, habits, workouts, goals, location, countries, insights) |
| `GET/POST /api/habits/{day,coffee,run,workout,body,goal}` | `x-admin-secret`                         | dashboard writes                                                                 |
| `GET/POST /api/metrics/subjective`                        | `x-admin-secret`                         | mood/energy/stress/focus                                                         |
| `POST /api/location`                                      | `x-admin-secret`                         | log a location (+ weather, visited country)                                      |
| `/api/strava/*`                                           | secret / Strava                          | OAuth, webhook, manual sync                                                      |
| `GET /api/cron/enrich`                                    | `Authorization: Bearer CRON_SECRET`      | hourly sweep for un-enriched contacts                                            |
| `/api/mcp`                                                | `Authorization: Bearer MCP_BEARER_TOKEN` | MCP server: `search_contacts`                                                    |

Rate limits are per client (secret holder, else `x-real-ip`) in Upstash Redis and answer `429` with `Retry-After`.

---

## Deployment

Pushes to `main` deploy to production on Vercel; pull requests get preview deployments. Project configuration lives in [`vercel.ts`](vercel.ts) (build/install commands, the enrichment cron). Environment variables are managed in the Vercel project; the build fails fast if a required one is missing.

---

## Further reading

- [`docs/REVALIDATION.md`](docs/REVALIDATION.md) — webhook payloads and what each invalidates
- [`docs/api/openapi.yaml`](docs/api/openapi.yaml) — dashboard API reference
- [`eve/README.md`](eve/README.md) — the recall agent and its MCP connection
- [`lib/cache/tags.ts`](lib/cache/tags.ts) — cache tags and invalidation sets

---

## Author

**Simon Krüger** — [cr0ss.org](https://cr0ss.org) · [@kayoslab](https://github.com/kayoslab)

This project is private and proprietary.

---

Built with ❤️ by Simon Krüger
