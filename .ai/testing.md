# Testing Guidelines

## Overview

This project currently follows a manual testing approach with strong compile-time guarantees through TypeScript. While automated tests may be added in the future, the current focus is on type safety, linting, and manual verification.

## Testing Philosophy

### Core Principles

1. **Type Safety First** - TypeScript strict mode catches many errors at compile time
2. **Manual Testing** - Thorough manual testing of features and user flows
3. **Build-Time Validation** - Ensure production build succeeds
4. **Continuous Validation** - Test as you develop, not just before commits

## Pre-Commit Checklist

### Required Checks

Before committing any code, run these commands and ensure they all pass:

```bash
# 1. TypeScript compilation (no errors)
npx tsc --noEmit

# 2. Linting (no errors or warnings)
npm run lint

# 3. Code formatting check
npm run format

# 4. Production build (for significant changes)
npm run build
```

### When to Run Build

Run a full production build when:
- ✅ Adding or modifying API routes
- ✅ Changing data fetching logic
- ✅ Modifying build-time generation (sitemap, RSS, static params)
- ✅ Updating environment variable usage
- ✅ Making significant architectural changes
- ✅ Before creating a pull request

Skip build for:
- ❌ Minor copy changes
- ❌ Style-only modifications
- ❌ Documentation updates
- ❌ Comment changes

## TypeScript Validation

### Type Checking

```bash
# Check all files for type errors
npx tsc --noEmit

# Expected output (success):
# (no output means success)

# If there are errors:
# src/components/blog.tsx:12:5 - error TS2322: Type 'string' is not assignable to type 'number'
```

### Common Type Issues to Watch For

```typescript
// ❌ Bad: Using 'any'
const data: any = await fetchData();

// ✅ Good: Proper typing
const data: BlogProps = await fetchData();

// ❌ Bad: Ignoring null/undefined
function getTitle(blog: BlogProps) {
  return blog.title.toUpperCase();  // What if title is undefined?
}

// ✅ Good: Handle null/undefined
function getTitle(blog: BlogProps) {
  return blog.title?.toUpperCase() ?? 'Untitled';
}

// ❌ Bad: Unsafe type assertion
const data = response.json() as BlogProps;

// ✅ Good: Runtime validation with Zod
const data = ZBlogProps.parse(response.json());
```

## Linting

### ESLint Checks

```bash
# Run ESLint
npm run lint

# Expected output (success):
# ✔ No ESLint warnings or errors

# Fix auto-fixable issues
npm run lint -- --fix
```

### Common Lint Issues

```typescript
// ❌ Bad: Unused imports
import { useState } from 'react';  // Warning: 'useState' is defined but never used

// ❌ Bad: Missing dependencies in useEffect
useEffect(() => {
  fetchData(id);
}, []);  // Warning: React Hook useEffect has a missing dependency: 'id'

// ❌ Bad: Unnecessary escape characters
const regex = /\d+/;  // Warning: Unnecessary escape character

// ✅ Good: Clean code
import { useState } from 'react';  // Only if used
const [state, setState] = useState();

useEffect(() => {
  fetchData(id);
}, [id]);  // Include all dependencies
```

## Code Formatting

### Prettier Checks

```bash
# Check formatting
npm run format

# Fix formatting issues
npm run format:fix
```

### Formatting Standards

- **Indentation**: 2 spaces
- **Line length**: 100 characters (soft limit)
- **Semicolons**: Required
- **Quotes**: Single quotes for strings, double for JSX attributes
- **Trailing commas**: ES5 (objects, arrays)

## Manual Testing Workflows

### Feature Testing

When implementing a new feature:

1. **Local Development Testing**
   ```bash
   npm run dev
   ```
   - Test the feature in development mode
   - Check browser console for errors
   - Verify responsive design (mobile, tablet, desktop)
   - Test dark mode (if applicable)

2. **Data Validation**
   - Verify correct data is fetched from Contentful/Database
   - Check for null/undefined handling
   - Test edge cases (empty lists, missing images, etc.)

3. **User Flow Testing**
   - Navigate through the feature as a user would
   - Test all interactive elements (buttons, forms, links)
   - Verify URL changes and browser back/forward
   - Check page metadata (title, description, Open Graph)

4. **Performance Check**
   - Open Chrome DevTools → Lighthouse
   - Run performance audit
   - Ensure scores remain high (>90)
   - Check Network tab for unnecessary requests

### API Route Testing

When creating or modifying API routes:

1. **Authentication Testing**
   ```bash
   # Test without auth (should fail)
   curl http://localhost:3000/api/protected

   # Test with auth (should succeed)
   curl http://localhost:3000/api/protected \
     -H "x-admin-secret: your-secret"
   ```

2. **Rate Limiting Testing**
   ```bash
   # Rapid requests to test rate limiting
   for i in {1..15}; do
     curl http://localhost:3000/api/endpoint
     echo "Request $i"
   done
   ```

3. **Input Validation Testing**
   ```bash
   # Valid input
   curl -X POST http://localhost:3000/api/endpoint \
     -H "Content-Type: application/json" \
     -d '{"field": "valid-value"}'

   # Invalid input (should return 400)
   curl -X POST http://localhost:3000/api/endpoint \
     -H "Content-Type: application/json" \
     -d '{"field": ""}'

   # Missing fields (should return 400)
   curl -X POST http://localhost:3000/api/endpoint \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

4. **Error Handling Testing**
   - Test with invalid IDs/slugs
   - Test with missing resources (404)
   - Test with malformed JSON
   - Verify error responses match format

### Webhook Testing

When modifying webhook endpoints:

1. **Use Contentful Webhook Test**
   - Go to Contentful → Settings → Webhooks
   - Select webhook
   - Click "View recent calls" or "Send test payload"

2. **Local Testing with cURL**
   ```bash
   # Blog post publish
   curl -X POST http://localhost:3000/api/revalidate \
     -H "Content-Type: application/json" \
     -H "x-vercel-revalidation-key: your-secret" \
     -d '{
       "sys": {
         "id": "test123",
         "contentType": {
           "sys": { "id": "blogPost" }
         }
       },
       "fields": {
         "slug": { "en-US": "test-post" }
       }
     }'
   ```

3. **Verify Effects**
   - Check console logs for revalidation messages
   - Verify cache was invalidated (refresh page, see new content)
   - Check Algolia index updated (if applicable)

### Content Testing

When content changes in Contentful:

1. **Preview Mode** (if enabled)
   - View draft content before publishing
   - Verify rendering is correct

2. **Published Content**
   - Publish content in Contentful
   - Wait for webhook (check logs)
   - Refresh page to see updated content
   - Check search index updated

3. **Edge Cases**
   - Missing images
   - Empty rich text fields
   - Very long titles/summaries
   - Special characters in text
   - HTML/markdown in fields

## Build Testing

### Production Build

```bash
# Build for production
npm run build

# Expected output:
# ✓ Compiled successfully
# ✓ Collecting page data
# ✓ Generating static pages (XX/XX)
# ✓ Finalizing page optimization
```

### Build Errors to Watch For

```bash
# ❌ Type error during build
Type error: Property 'slug' does not exist on type 'BlogProps'

# ❌ Missing environment variable
Error: Environment variable 'CONTENTFUL_SPACE_ID' is not defined

# ❌ Static generation failure
Error occurred prerendering page "/blog/[slug]"

# ❌ Import error
Module not found: Can't resolve '@/lib/missing-file'
```

### Post-Build Testing

```bash
# Start production server
npm run start

# Test in production mode
# - Verify all pages load
# - Check static generation worked
# - Test API routes
# - Verify environment variables
```

## Browser Testing

### Browsers to Test

Minimum testing browsers:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

### What to Test in Each Browser

1. **Layout & Styling**
   - Responsive design (mobile, tablet, desktop)
   - Dark mode toggle
   - Images load correctly
   - Fonts render properly

2. **Functionality**
   - Navigation works
   - Forms submit correctly
   - Interactive elements respond
   - Client-side JavaScript executes

3. **Performance**
   - Page load time
   - Image optimization
   - Core Web Vitals

## Accessibility Testing

### Manual Accessibility Checks

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify focus indicators visible
   - Test keyboard shortcuts (if any)

2. **Screen Reader Testing** (if possible)
   - Use VoiceOver (Mac) or NVDA (Windows)
   - Verify alt text on images
   - Check heading structure
   - Test form labels

3. **Color Contrast**
   - Use Chrome DevTools → Lighthouse
   - Check accessibility score
   - Verify text has sufficient contrast

4. **Semantic HTML**
   - Proper heading hierarchy (h1, h2, h3)
   - Use of semantic elements (article, nav, main)
   - ARIA labels where needed

## Database Testing

### Query Testing

```bash
# Connect to database
psql $DATABASE_URL

# Test queries manually
SELECT * FROM coffee_events WHERE event_date = CURRENT_DATE;

# Verify schema
\d coffee_events
\d body_events
\d goals
```

### Data Validation

- Verify queries return expected data
- Check for null values where not expected
- Test with empty tables
- Test with large datasets

## Regression Testing

### Before Major Releases

Test these critical user flows:

1. **Homepage**
   - Loads correctly
   - Links work
   - Hero image displays

2. **Blog List**
   - Posts display
   - Pagination works
   - Categories filter correctly
   - Search functions

3. **Blog Post**
   - Content renders correctly
   - Images load
   - Code snippets highlight
   - Metadata correct (title, OG image)

4. **Dashboard** (if authenticated)
   - Charts load
   - Data displays correctly
   - Forms submit successfully

5. **Search**
   - Returns results
   - Handles empty query
   - Displays correctly

## Monitoring in Production

### Post-Deployment Checks

After deploying to production:

1. **Immediate Verification**
   - Visit homepage
   - Check a blog post
   - Test search
   - Verify API endpoints responding

2. **Vercel Dashboard**
   - Check deployment logs
   - Verify no build errors
   - Check function execution logs

3. **Analytics**
   - Vercel Analytics (page views, errors)
   - Check for 404s or 500s
   - Monitor Core Web Vitals

4. **Error Tracking**
   - Check Vercel logs for errors
   - Monitor console logs
   - Watch for rate limit hits

### Ongoing Monitoring

- Check Vercel dashboard weekly
- Review error logs
- Monitor performance metrics
- Check for broken links

## Test Data

### Creating Test Content

When testing content features:

1. **Create Test Content in Contentful**
   - Use "Draft" status for testing
   - Include edge cases (long titles, missing images)
   - Test with different content types

2. **Test Database Operations**
   ```sql
   -- Insert test data
   INSERT INTO coffee_events (event_date, brew_method, rating)
   VALUES (CURRENT_DATE, 'espresso', 5);

   -- Verify
   SELECT * FROM coffee_events WHERE event_date = CURRENT_DATE;

   -- Clean up
   DELETE FROM coffee_events WHERE event_date = CURRENT_DATE;
   ```

## Troubleshooting

### Common Issues

**TypeScript errors after dependency update:**
```bash
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

**Build fails but dev works:**
```bash
# Check for environment variables
# Verify all required env vars in .env.local

# Check for dynamic imports that might fail in build
# Look for process.browser or window usage in Server Components
```

**Lint errors on commit:**
```bash
# Auto-fix what's possible
npm run lint -- --fix

# Format code
npm run format:fix
```

## Future: Automated Testing

### Potential Testing Strategy

If automated tests are added in the future, consider:

1. **Unit Tests** (Jest + React Testing Library)
   - Component rendering
   - Utility function logic
   - Data transformations

2. **Integration Tests** (Playwright)
   - User flows
   - Form submissions
   - Navigation

3. **API Tests** (Vitest)
   - Endpoint responses
   - Validation logic
   - Error handling

4. **E2E Tests** (Playwright)
   - Critical user journeys
   - Blog post reading flow
   - Search functionality

### Test Coverage Goals

If implementing automated tests:
- **Components**: 80%+ coverage
- **API Routes**: 100% coverage
- **Utilities**: 90%+ coverage
- **Integration**: Critical flows only

## Checklist Summary

### Every Commit
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] Tested locally in dev mode
- [ ] No console errors or warnings

### Significant Changes
- [ ] Production build succeeds (`npm run build`)
- [ ] Manual testing of affected features
- [ ] Cross-browser testing
- [ ] API routes tested with cURL
- [ ] Webhooks tested (if modified)

### Before Release
- [ ] All pre-commit checks pass
- [ ] Production build succeeds
- [ ] Regression testing complete
- [ ] Performance check (Lighthouse)
- [ ] Accessibility check
- [ ] Mobile testing
- [ ] Documentation updated
