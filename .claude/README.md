# cr0ss.org - Project Context for AI Agents

This document provides essential context for AI agents working on this Next.js 15 project.

## Project Overview

Personal and professional website of Simon Krüger, built with Next.js 15, TypeScript, and Contentful CMS. Features a blog, personal dashboard with habit tracking, caffeine metabolism modeling, travel map, and more.

**Live Site:** [cr0ss.org](https://cr0ss.org)

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **CMS**: Contentful (headless)
- **Database**: Neon (serverless PostgreSQL)
- **Search**: Algolia
- **Cache**: Vercel KV (Redis)
- **Deployment**: Vercel
- **Testing**: Vitest + Testing Library + MSW

## Key Documentation

All detailed documentation is in `.claude/docs/`:

### Architecture & Patterns
- **[architecture.md](docs/architecture.md)** - System architecture, data flow, and design patterns
- **[tech-stack.md](docs/tech-stack.md)** - Detailed technology choices and rationale
- **[api-patterns.md](docs/api-patterns.md)** - API route patterns, authentication, rate limiting
- **[component-patterns.md](docs/component-patterns.md)** - React component patterns and conventions
- **[database-patterns.md](docs/database-patterns.md)** - Database schema, queries, and migrations

### Development Standards
- **[coding-standards.md](docs/coding-standards.md)** - TypeScript conventions, naming, file organization
- **[testing.md](docs/testing.md)** - Testing philosophy and current approach
- **[testing-guidelines.md](docs/testing-guidelines.md)** - Comprehensive testing standards with Vitest
- **[test-strategy.md](docs/test-strategy.md)** - Testing roadmap and implementation plan
- **[security.md](docs/security.md)** - Security patterns, authentication, and best practices

## Quick Reference

### File Structure
```
├── app/                    # Next.js App Router
│   ├── api/               # API routes (Edge runtime)
│   ├── blog/              # Blog pages
│   ├── dashboard/         # Personal dashboard
│   └── page/[slug]/       # Dynamic Contentful pages
├── components/            # React components
├── lib/                   # Utilities and business logic
│   ├── contentful/       # CMS integration
│   ├── db/               # Database queries
│   ├── phys/             # Physics models (caffeine)
│   ├── time/             # Timezone utilities
│   └── api/              # API middleware
├── test/                  # Test utilities and mocks
└── .claude/              # AI agent documentation (this folder)
```

### Key Concepts

**Authentication**:
- Standard endpoints: `x-vercel-revalidation-key` header with `DASHBOARD_API_SECRET`
- Contentful webhooks: `x-vercel-revalidation-key` header with `CONTENTFUL_REVALIDATE_SECRET`
- See `lib/auth/secret.tsx` for implementation

**Timezone Handling**:
- All times stored in UTC in database
- UI displays in Berlin timezone (Europe/Berlin)
- Use `lib/time/berlin.tsx` utilities for conversions

**Cache Strategy**:
- Next.js cache tags for granular invalidation
- Vercel KV for rate limiting and geolocation
- Webhooks trigger revalidation on content changes

**Testing Strategy**:
- Vitest for fast unit/integration tests
- Testing Library for component tests
- MSW for API mocking
- Target: 75%+ overall coverage
- All tests must pass before merge

### Environment Variables

Required for development:
```bash
# Contentful
CONTENTFUL_SPACE_ID
CONTENTFUL_ACCESS_TOKEN
CONTENTFUL_REVALIDATE_SECRET

# Database
DATABASE_URL

# Search
ALGOLIA_APP_ID
ALGOLIA_ADMIN_KEY
ALGOLIA_SEARCH_KEY

# API Secrets
DASHBOARD_API_SECRET

# Cache
KV_REST_API_URL
KV_REST_API_TOKEN
```

## Development Workflow

1. **Before Starting Work**:
   - Read relevant docs from `.claude/docs/`
   - Check existing patterns in the codebase
   - Review test coverage for similar features

2. **Code Quality Checks**:
   ```bash
   pnpm tsc --noEmit    # Type checking
   pnpm lint            # Linting
   pnpm test            # Run tests
   pnpm build           # Verify build
   ```

3. **Testing Requirements**:
   - Write tests for all new business logic
   - Test API routes with authentication/validation
   - Component tests for interactive features
   - See `docs/testing-guidelines.md` for details

4. **Commit Standards**:
   - TypeScript must compile without errors
   - All tests must pass
   - Follow existing code style
   - Include tests with new features

## Special Features

### Caffeine Metabolism Modeling
- Located in `lib/phys/caffeine.tsx`
- Models caffeine decay over time using pharmacokinetic equations
- Supports custom half-life, body composition, and sensitivity
- Comprehensive test coverage in `lib/phys/caffeine.test.ts`

### Berlin Timezone Utilities
- All dashboard times use Berlin timezone
- Utilities in `lib/time/berlin.tsx`
- Handles DST transitions correctly
- Tested extensively

### Geographic Calculations
- Centroid calculations for map visualization
- Distance calculations for location tracking
- Bug fix: Proper handling of coordinates at 0,0 (Null Island)

## Common Patterns

### API Routes
```typescript
export const runtime = "edge";

export async function GET(req: Request) {
  try {
    assertSecret(req); // Authentication
    // ... logic
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error }, { status: 401 });
  }
}
```

### Data Validation
```typescript
import { z } from 'zod';

const Schema = z.object({
  field: z.string().min(1),
  number: z.coerce.number().positive()
});

const validated = Schema.parse(data);
```

### Testing
```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Feature', () => {
  it('should do something', () => {
    // Arrange
    const input = ...;

    // Act
    const result = ...;

    // Assert
    expect(result).toBe(expected);
  });
});
```

## Important Notes

- **Never commit secrets** - Use environment variables
- **Test edge cases** - Especially timezone and coordinate handling
- **Follow TypeScript strict mode** - No `any` types
- **Prefer server components** - Use client components only when needed
- **Co-locate tests** - Keep `*.test.ts` next to source files
- **Update docs** - Keep `.claude/docs/` current with changes

## Getting Help

- **Architecture questions** → See `docs/architecture.md`
- **API patterns** → See `docs/api-patterns.md`
- **Testing help** → See `docs/testing-guidelines.md`
- **Security concerns** → See `docs/security.md`
- **Database queries** → See `docs/database-patterns.md`

---

**Last Updated**: 2025-10-21
**Project Version**: Next.js 15.5.6
**Test Coverage**: 132 tests passing across 7 test files
