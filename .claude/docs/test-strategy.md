# Test Strategy

This document outlines the comprehensive testing strategy for cr0ss.org, including implementation roadmap, priorities, and maintenance guidelines.

## Table of Contents

- [Overview](#overview)
- [Testing Pyramid](#testing-pyramid)
- [Implementation Roadmap](#implementation-roadmap)
- [Test Infrastructure](#test-infrastructure)
- [Critical Test Coverage](#critical-test-coverage)
- [Mocking Strategy](#mocking-strategy)
- [Performance Testing](#performance-testing)
- [Maintenance & Evolution](#maintenance--evolution)

## Overview

### Goals
1. **Prevent Regressions**: Catch bugs before they reach production
2. **Enable Refactoring**: Safely improve code with confidence
3. **Document Behavior**: Tests serve as executable specifications
4. **Improve Code Quality**: TDD encourages better design
5. **Faster Development**: Quick feedback loop for changes

### Current State
- ✅ TypeScript strict mode enabled
- ✅ ESLint configured
- ✅ Zod validation in place
- ❌ No test infrastructure
- ❌ No existing tests

### Target State
- ✅ Vitest + Testing Library configured
- ✅ 75%+ code coverage
- ✅ All critical paths tested
- ✅ CI/CD integration
- ✅ Pre-commit hooks for tests

## Testing Pyramid

```
                    /\
                   /  \
                  / E2E \
                 /  5%   \
                /----------\
               /            \
              / Integration  \
             /      20%       \
            /------------------\
           /                    \
          /    Unit & Component  \
         /         75%            \
        /____________________________\
```

### Unit Tests (75%)
**What**: Pure functions, utilities, validation logic
**Why**: Fast, reliable, easy to maintain
**Tools**: Vitest

**Examples**:
- Caffeine metabolism calculations
- Date/time conversions
- Zod schema validation
- Map centroid calculations
- Data transformations

### Integration Tests (20%)
**What**: API routes, database queries, external API integration
**Why**: Test how components work together
**Tools**: Vitest + MSW + Test Database

**Examples**:
- API routes with authentication
- Database query results
- Contentful API integration
- Algolia search integration
- Cache behavior

### E2E Tests (5%)
**What**: Critical user flows
**Why**: Verify complete system behavior
**Tools**: Playwright (future)

**Examples**:
- View dashboard with data
- Search and filter blog posts
- Navigate between pages
- Mobile responsive behavior

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Goal**: Set up testing infrastructure

1. **Install Dependencies**
   ```bash
   pnpm add -D vitest @vitejs/plugin-react
   pnpm add -D @testing-library/react @testing-library/jest-dom
   pnpm add -D @testing-library/user-event
   pnpm add -D msw
   pnpm add -D @types/node
   ```

2. **Configure Vitest**
   - Create `vitest.config.ts`
   - Set up test environment
   - Configure path aliases
   - Add test scripts to `package.json`

3. **Set Up Test Utilities**
   - Create test helpers
   - Configure MSW handlers
   - Set up test database utilities
   - Create mock factories

4. **Deliverables**:
   - ✅ Vitest running
   - ✅ First test passing
   - ✅ npm scripts configured

### Phase 2: Core Business Logic (Week 2-3)
**Goal**: Test critical utilities and calculations

**Priority 1: Caffeine Modeling**
- `lib/phys/caffeine.ts` - Core algorithm
- Test decay calculations
- Test edge cases (empty events, negative values)
- Test with various body parameters

**Priority 2: Time Utilities**
- `lib/time/berlin.ts` - Timezone conversions
- Test UTC ↔ Berlin conversions
- Test DST transitions
- Test date formatting

**Priority 3: Validation**
- `lib/db/validation.ts` - Zod schemas
- Test schema validation
- Test error messages
- Test type inference

**Priority 4: Database Queries**
- `lib/db/queries.tsx` - Data fetching
- Test with mock SQL responses
- Test data transformations
- Test error handling

**Deliverables**:
- ✅ 90%+ coverage on utilities
- ✅ All business logic tested
- ✅ Edge cases covered

### Phase 3: API Routes (Week 4)
**Goal**: Test all API endpoints

**Routes to Test**:
1. `/api/habits/day` - Daily habits CRUD
2. `/api/habits/coffee` - Coffee logging
3. `/api/habits/run` - Running data
4. `/api/habits/workout` - Workout tracking
5. `/api/habits/goal` - Monthly goals
6. `/api/habits/body` - Body composition
7. `/api/dashboard` - Dashboard data aggregation
8. `/api/auth/check` - Authentication

**Test Cases Per Route**:
- ✅ Successful requests
- ✅ Validation errors
- ✅ Authentication failures
- ✅ Rate limiting
- ✅ Error handling
- ✅ Edge cases

**Deliverables**:
- ✅ 80%+ coverage on API routes
- ✅ All endpoints tested
- ✅ Security validated

### Phase 4: Components (Week 5)
**Goal**: Test interactive UI components

**Priority Components**:
1. **Search Bar** - User input, async search
2. **Dashboard Charts** - Data visualization
3. **Settings Forms** - Complex state management
4. **Blog Components** - Content rendering
5. **Map Component** - Interactive visualization

**Test Focus**:
- User interactions
- Conditional rendering
- Error states
- Loading states
- Accessibility

**Deliverables**:
- ✅ 70%+ coverage on components
- ✅ Critical interactions tested
- ✅ A11y validated

### Phase 5: Integration (Week 6)
**Goal**: Test system integration points

**Integration Points**:
1. **Contentful CMS** - Content fetching
2. **Algolia Search** - Search functionality
3. **Vercel KV** - Caching
4. **Neon Database** - Data persistence
5. **External APIs** - Third-party services

**Approach**:
- Use MSW for API mocking
- Test database with test instance
- Test cache invalidation
- Test error recovery

**Deliverables**:
- ✅ Integration tests for all external deps
- ✅ Mock handlers comprehensive
- ✅ Error scenarios covered

### Phase 6: CI/CD & Automation (Week 7)
**Goal**: Automate testing in pipeline

1. **GitHub Actions**
   - Run tests on PR
   - Check coverage thresholds
   - Fail on test failures

2. **Pre-commit Hooks**
   - Run affected tests
   - Quick feedback for developers

3. **Coverage Reporting**
   - Generate coverage reports
   - Upload to codecov/coveralls
   - Track trends over time

**Deliverables**:
- ✅ CI pipeline running tests
- ✅ Coverage reporting configured
- ✅ Pre-commit hooks active

## Test Infrastructure

### Directory Structure
```
/
├── lib/
│   ├── phys/
│   │   ├── caffeine.ts
│   │   └── caffeine.test.ts
│   └── time/
│       ├── berlin.ts
│       └── berlin.test.ts
├── app/
│   └── api/
│       └── habits/
│           └── day/
│               ├── route.ts
│               └── route.test.ts
├── components/
│   └── dashboard/
│       ├── Section.tsx
│       └── Section.test.tsx
└── test/
    ├── setup.ts                # Global test setup
    ├── utils.tsx               # Test helpers
    ├── mocks/
    │   ├── handlers.ts         # MSW handlers
    │   ├── db.ts               # Database mocks
    │   └── factories.ts        # Test data factories
    └── fixtures/
        ├── blog-posts.json     # Sample data
        └── habits-data.json
```

### Configuration Files

#### `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'lib/contentful/setup.ts'
      ],
      thresholds: {
        branches: 75,
        functions: 75,
        lines: 75,
        statements: 75
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
});
```

#### `test/setup.ts`
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Clean up after all tests
afterAll(() => server.close());

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test@localhost:5432/test';
process.env.DASHBOARD_API_SECRET = 'test-secret';
process.env.CONTENTFUL_SPACE_ID = 'test-space';
process.env.CONTENTFUL_ACCESS_TOKEN = 'test-token';
```

#### `package.json` Scripts
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:coverage:ui": "vitest run --coverage --ui",
    "test:changed": "vitest run --changed",
    "test:ci": "vitest run --coverage --reporter=verbose"
  }
}
```

## Critical Test Coverage

### Must Test (Priority 1)

#### Business Logic
- [x] `lib/phys/caffeine.ts` - Caffeine metabolism
  - Decay calculations
  - Multiple dose accumulation
  - Body parameter variations

- [x] `lib/time/berlin.ts` - Time conversions
  - UTC to Berlin timezone
  - DST handling
  - Date formatting

- [x] `lib/db/validation.ts` - Data validation
  - All Zod schemas
  - Error messages
  - Type inference

#### API Routes
- [x] `/api/habits/*` - All habit tracking endpoints
  - Authentication
  - Validation
  - CRUD operations
  - Rate limiting

- [x] `/api/dashboard` - Data aggregation
  - Complex calculations
  - Error handling
  - Performance

### Should Test (Priority 2)

#### Components
- [x] Search functionality
- [x] Form submissions
- [x] Interactive charts
- [x] Modal dialogs
- [x] Error boundaries

#### Integration
- [x] Contentful API
- [x] Algolia search
- [x] Database queries
- [x] Cache invalidation

### Nice to Have (Priority 3)

#### E2E Flows
- [ ] Complete user journeys
- [ ] Mobile experience
- [ ] Performance metrics
- [ ] Visual regression

## Mocking Strategy

### External Dependencies

#### Contentful CMS
```typescript
// test/mocks/contentful.ts
export const mockBlogPost = {
  sys: { id: '1', firstPublishedAt: '2024-01-01' },
  title: 'Test Post',
  slug: 'test-post',
  content: { json: { nodeType: 'document', content: [] } }
};

export const contentfulHandlers = [
  http.post('*/graphql', () => {
    return HttpResponse.json({
      data: {
        blogPostCollection: {
          items: [mockBlogPost],
          total: 1
        }
      }
    });
  })
];
```

#### Database
```typescript
// test/mocks/db.ts
import { vi } from 'vitest';

export const mockSql = vi.fn((strings, ...values) => {
  const query = strings.join('?');

  if (query.includes('SELECT') && query.includes('days')) {
    return Promise.resolve([
      { date: '2024-01-01', steps: 10000, sleep_score: 85 }
    ]);
  }

  return Promise.resolve([]);
});
```

#### Algolia
```typescript
// test/mocks/algolia.ts
export const algoliaHandlers = [
  http.post('*/1/indexes/*/query', () => {
    return HttpResponse.json({
      hits: [{ objectID: '1', title: 'Test' }],
      nbHits: 1
    });
  })
];
```

## Performance Testing

### Load Testing
```typescript
// test/performance/api-load.test.ts
import { describe, it, expect } from 'vitest';

describe('API Performance', () => {
  it('should handle 100 concurrent requests', async () => {
    const requests = Array(100).fill(null).map(() =>
      fetch('/api/dashboard')
    );

    const start = Date.now();
    const responses = await Promise.all(requests);
    const duration = Date.now() - start;

    expect(responses.every(r => r.ok)).toBe(true);
    expect(duration).toBeLessThan(5000); // 5s for 100 requests
  });
});
```

### Memory Leaks
```typescript
// test/performance/memory.test.ts
describe('Memory Management', () => {
  it('should not leak memory in caffeine model', () => {
    const initialMemory = process.memoryUsage().heapUsed;

    for (let i = 0; i < 1000; i++) {
      modelCaffeine(largeEventArray, body, options);
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const growth = finalMemory - initialMemory;

    expect(growth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
  });
});
```

## Maintenance & Evolution

### Test Health Monitoring

#### Red Flags
- ⚠️ Flaky tests (pass/fail inconsistently)
- ⚠️ Slow tests (>5s for unit tests)
- ⚠️ Brittle tests (break on refactoring)
- ⚠️ Unclear failure messages
- ⚠️ Excessive mocking

#### Green Flags
- ✅ Fast execution (<1s per test)
- ✅ Clear, focused tests
- ✅ Meaningful assertions
- ✅ Good failure messages
- ✅ Isolated, independent tests

### Updating Tests

#### When Code Changes
1. Run affected tests first
2. Update test if behavior changed
3. Add tests for new functionality
4. Remove tests for deleted code

#### When Tests Fail
1. Understand why it failed
2. Fix the bug OR update the test
3. Never just skip failing tests
4. Investigate flaky tests immediately

### Test Review Checklist

#### For New Tests
- [ ] Tests behavior, not implementation
- [ ] Has clear, descriptive name
- [ ] Follows AAA pattern
- [ ] Has meaningful assertions
- [ ] Handles edge cases
- [ ] Is fast and deterministic
- [ ] Has no unnecessary mocks

#### For Test Updates
- [ ] Still testing correct behavior
- [ ] Not introducing brittleness
- [ ] Maintaining coverage
- [ ] Clear commit message explaining why

## Metrics & KPIs

### Track Over Time
- Test count (unit, integration, e2e)
- Code coverage %
- Test execution time
- Flaky test rate
- Bug escape rate

### Success Criteria
- ✅ 75%+ code coverage
- ✅ <5 minute test suite runtime
- ✅ <1% flaky test rate
- ✅ Zero failing tests in main branch
- ✅ All PRs have tests

## Resources

- [Testing Guidelines](.ai/testing-guidelines.md)
- [Vitest Best Practices](https://vitest.dev/guide/best-practices.html)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

## Next Steps

1. Review this strategy with the team
2. Begin Phase 1 implementation
3. Set up CI/CD pipeline
4. Train team on testing best practices
5. Monitor metrics and adjust as needed
