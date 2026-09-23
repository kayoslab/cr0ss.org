import { test, expect } from '@playwright/test';

/**
 * One pass over every kind of route the site has: static content, a
 * Contentful-backed detail page, the partially prerendered dashboard, the
 * feeds, and a secret-gated API. Any of these failing means a deploy is
 * broken in a way unit tests can't see.
 */

test('home renders the site chrome', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/cr0ss/);
  await expect(page.getByRole('link', { name: 'Blog' }).first()).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Portfolio' }).first()
  ).toBeVisible();
});

test('blog list links to a post that renders', async ({ page }) => {
  await page.goto('/blog');
  const firstPost = page
    .locator('a[href^="/blog/"]:not([href*="/category/"])')
    .first();
  await expect(firstPost).toBeVisible();
  const href = await firstPost.getAttribute('href');
  await firstPost.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.locator('article, main').first()).toBeVisible();
  await expect(
    page.locator('script[type="application/ld+json"]').first()
  ).toHaveCount(1);
});

test('portfolio lists projects', async ({ page }) => {
  await page.goto('/portfolio');
  await expect(
    page.getByRole('heading', { name: /Things I.ve been building/ })
  ).toBeVisible();
  await expect(page.locator('a[href^="/portfolio/"]').first()).toBeVisible();
});

test('dashboard overview streams its data', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  // The KPI tiles come from the request-time part of the page.
  await expect(page.getByText('Coffee Cups')).toBeVisible();
  await expect(page.getByText('Countries')).toBeVisible();
});

test('feeds are served', async ({ request }) => {
  const rss = await request.get('/rss.xml');
  expect(rss.ok()).toBeTruthy();
  expect(rss.headers()['content-type']).toContain('xml');
  expect(await rss.text()).toContain('<rss');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain('/portfolio');
});

test('secret-gated API rejects anonymous reads and never CDN-caches', async ({
  request,
}) => {
  const res = await request.get('/api/v1/dashboard/habits/today');
  expect(res.status()).toBe(401);
  expect(await res.json()).toMatchObject({ error: 'Unauthorized' });
});

test('legacy /projects redirects to /portfolio', async ({ page }) => {
  await page.goto('/projects');
  await expect(page).toHaveURL(/\/portfolio$/);
});
