# Testing Guidelines

This document outlines testing standards and best practices for this Next.js 15 + React 19 application.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Testing Stack](#testing-stack)
- [What to Test](#what-to-test)
- [Test Structure](#test-structure)
- [Testing Patterns](#testing-patterns)
- [Mocking Guidelines](#mocking-guidelines)
- [Test Coverage Goals](#test-coverage-goals)
- [CI/CD Integration](#cicd-integration)

## Testing Philosophy

**Write tests that:**
- Verify behavior, not implementation
- Test user-facing functionality
- Catch regressions before production
- Serve as living documentation
- Are fast, reliable, and maintainable

**Avoid tests that:**
- Test framework internals
- Are tightly coupled to implementation details
- Require excessive mocking
- Are slow or flaky
- Duplicate coverage

## Testing Stack

### Core Framework
- **Vitest** - Fast, modern test runner with first-class TypeScript support
- **@testing-library/react** - User-centric component testing
- **@testing-library/user-event** - Realistic user interaction simulation
- **@testing-library/jest-dom** - Custom DOM matchers

### Additional Tools
- **MSW (Mock Service Worker)** - API mocking at the network level
- **@testing-library/react-hooks** - Hook testing utilities
- **node-mocks-http** - HTTP request/response mocking for API routes

### Why Vitest over Jest?
- Native ESM support (better for Next.js 15)
- Faster execution with smart parallelization
- Better TypeScript integration
- Compatible with Jest API (easy migration path)
- Vite-powered development experience

## What to Test

### Priority 1: Business Logic (Utility Functions)
✅ **Test extensively:**
- Pure functions in `/lib`
- Data transformations
- Calculations (caffeine modeling, date/time utilities)
- Validation logic
- Type coercion and parsing

**Example files to test:**
- `/lib/phys/caffeine.ts` - Caffeine metabolism calculations
- `/lib/time/berlin.ts` - Timezone conversions
- `/lib/db/validation.ts` - Zod schemas
- `/lib/map/centroid.ts` - Geographic calculations

### Priority 2: API Routes
✅ **Test:**
- Request validation
- Authentication/authorization
- Error handling
- Response format
- Rate limiting behavior

**Example routes:**
- `/app/api/habits/*/route.tsx`
- `/app/api/dashboard/route.tsx`

### Priority 3: React Components
✅ **Test:**
- User interactions
- Conditional rendering
- Error states
- Accessibility
- Client-side state management

**Focus on:**
- Client components with complex logic
- Form handling components
- Interactive UI (search, filters, modals)

### Priority 4: Integration Tests
✅ **Test:**
- Database queries (with test database)
- External API integration (with MSW)
- End-to-end user flows (critical paths)

### ❌ Lower Priority (Don't Test)
- Server Components (test the underlying logic instead)
- Simple presentational components
- Third-party library internals
- CSS/styling (use visual regression testing tools instead)
- Configuration files

## Test Structure

### File Organization
```
/lib
  /phys
    caffeine.ts
    caffeine.test.ts           # Co-located with source
  /time
    berlin.ts
    berlin.test.ts

/app/api
  /habits
    /day
      route.ts
      route.test.ts            # API route tests

/components
  /dashboard
    Section.tsx
    Section.test.tsx           # Component tests
```

### Naming Conventions
- Test files: `*.test.ts`, `*.test.tsx`
- Test suites: `describe('ComponentName', () => {})`
- Test cases: `it('should do something when condition', () => {})`
- Use descriptive names that explain the behavior

### Test Anatomy
```typescript
describe('functionName', () => {
  // Arrange - Setup
  const input = {...};
  const expected = {...};

  // Act - Execute
  const result = functionName(input);

  // Assert - Verify
  expect(result).toEqual(expected);
});
```

## Testing Patterns

### 1. Testing Pure Functions

```typescript
// lib/phys/caffeine.test.ts
import { describe, it, expect } from 'vitest';
import { modelCaffeine } from './caffeine';

describe('modelCaffeine', () => {
  it('should calculate caffeine decay over time', () => {
    const events = [
      { time: '2024-01-01T08:00:00Z', amount_ml: 200, type: 'espresso' }
    ];
    const body = { weight_kg: 70, half_life_hours: 5 };
    const options = {
      startISO: '2024-01-01T08:00:00Z',
      endISO: '2024-01-01T14:00:00Z',
      gridMinutes: 60
    };

    const result = modelCaffeine(events, body, options);

    expect(result).toHaveLength(7); // 6 hours + initial
    expect(result[0].body_mg).toBeGreaterThan(result[6].body_mg);
    expect(result.every(p => p.body_mg >= 0)).toBe(true);
  });

  it('should handle empty events array', () => {
    const result = modelCaffeine([], { weight_kg: 70 }, {
      startISO: '2024-01-01T00:00:00Z',
      endISO: '2024-01-01T01:00:00Z',
      gridMinutes: 60
    });

    expect(result).toHaveLength(2);
    expect(result.every(p => p.body_mg === 0)).toBe(true);
  });
});
```

### 2. Testing API Routes

```typescript
// app/api/habits/day/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { createMocks } from 'node-mocks-http';

vi.mock('@/lib/auth/secret');
vi.mock('@/lib/db/client');

describe('GET /api/habits/day', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return day data for valid date', async () => {
    const { req } = createMocks({
      method: 'GET',
      url: '/api/habits/day?date=2024-01-01',
      headers: { 'x-api-secret': 'test-secret' }
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('steps');
    expect(data).toHaveProperty('sleep_score');
  });

  it('should return 401 without valid secret', async () => {
    const { req } = createMocks({
      method: 'GET',
      url: '/api/habits/day?date=2024-01-01'
    });

    const response = await GET(req as any);

    expect(response.status).toBe(401);
  });
});
```

### 3. Testing React Components

```typescript
// components/dashboard/Section.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Section from './Section';

describe('Section', () => {
  it('should render title and children', () => {
    render(
      <Section title="Test Section">
        <p>Test content</p>
      </Section>
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(
      <Section title="Test Section" id="test-section">
        <p>Content</p>
      </Section>
    );

    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-labelledby', 'test-section-heading');
  });
});
```

### 4. Testing Client Components with State

```typescript
// components/search/search-bar.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from './search-bar';

describe('SearchBar', () => {
  it('should show results when typing', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'test query');

    await waitFor(() => {
      expect(screen.getByText(/results/i)).toBeInTheDocument();
    });
  });

  it('should call onSearch when submitted', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'test');
    await user.keyboard('{Enter}');

    expect(onSearch).toHaveBeenCalledWith('test');
  });
});
```

### 5. Testing Database Queries

```typescript
// lib/db/queries.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { qHabitsToday } from './queries';
import { setupTestDatabase, teardownTestDatabase } from '../test/db-setup';

describe('qHabitsToday', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should return habits for today', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const habits = await qHabitsToday(today);

    expect(habits).toMatchObject({
      steps: expect.any(Number),
      sleep_score: expect.any(Number),
      focus_minutes: expect.any(Number)
    });
  });
});
```

## Mocking Guidelines

### When to Mock
✅ **Mock:**
- External APIs (Contentful, Algolia, Vercel KV)
- Database connections in unit tests
- Authentication/authorization
- Rate limiting
- Date/time (for predictable tests)

❌ **Don't Mock:**
- The code you're testing
- Simple utility functions
- TypeScript types
- React/Next.js framework code

### Mocking Patterns

#### External APIs (MSW)
```typescript
// test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://graphql.contentful.com/content/v1/spaces/:spaceId', () => {
    return HttpResponse.json({
      data: {
        blogPostCollection: {
          items: [{ title: 'Test Post', slug: 'test' }]
        }
      }
    });
  }),
];
```

#### Database Mocking
```typescript
import { vi } from 'vitest';

vi.mock('@/lib/db/client', () => ({
  sql: vi.fn((strings, ...values) => {
    // Return mock data based on query
    return Promise.resolve([{ id: 1, date: '2024-01-01' }]);
  })
}));
```

#### Date Mocking
```typescript
import { vi } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});
```

## Test Coverage Goals

### Minimum Coverage Targets
- **Critical business logic**: 90%+
- **API routes**: 80%+
- **Utility functions**: 85%+
- **Components**: 70%+
- **Overall**: 75%+

### Coverage Commands
```bash
# Generate coverage report
pnpm test:coverage

# View coverage in browser
pnpm test:coverage:ui
```

### What Coverage Doesn't Mean
- High coverage ≠ good tests
- Focus on meaningful assertions
- Test behavior, not just execution paths

## CI/CD Integration

### Pre-commit
```bash
# Run tests before commit
pnpm test:changed
```

### Pull Request
```bash
# Run all tests
pnpm test

# Check coverage
pnpm test:coverage
```

### Deployment
```bash
# Run tests + lint + type-check
pnpm test:ci
```

## Best Practices Checklist

### General
- [ ] Tests are deterministic (no random data)
- [ ] Tests are isolated (no shared state)
- [ ] Tests are fast (<5s for unit tests)
- [ ] Tests have clear failure messages
- [ ] Tests follow AAA pattern (Arrange, Act, Assert)

### TypeScript
- [ ] No `any` types in test files
- [ ] Use proper type inference
- [ ] Mock types match real types

### React
- [ ] Query by accessibility roles/labels
- [ ] Await async operations
- [ ] Clean up after tests
- [ ] Test user interactions, not implementation

### API
- [ ] Test validation errors
- [ ] Test authentication
- [ ] Test rate limiting
- [ ] Test error responses

## Common Pitfalls

### ❌ Don't: Test Implementation Details
```typescript
// Bad - testing internal state
expect(component.state.isLoading).toBe(true);

// Good - testing visible behavior
expect(screen.getByText('Loading...')).toBeInTheDocument();
```

### ❌ Don't: Over-mock
```typescript
// Bad - mocking everything
vi.mock('./utils/formatDate');
vi.mock('./utils/parseDate');
vi.mock('./utils/validateDate');

// Good - test real utilities, mock external deps
import { formatDate, parseDate, validateDate } from './utils';
vi.mock('@/lib/api/external-api');
```

### ❌ Don't: Write Brittle Selectors
```typescript
// Bad - brittle CSS selectors
const button = container.querySelector('.btn-primary.submit-btn');

// Good - accessible queries
const button = screen.getByRole('button', { name: /submit/i });
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)
- [Kent C. Dodds Testing Blog](https://kentcdodds.com/blog?q=testing)

## Questions?

Consult this guide when writing tests. For patterns not covered here, refer to existing test files in the codebase or ask for guidance.
