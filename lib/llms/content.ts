import { cacheLife, cacheTag } from 'next/cache';
import { getAllBlogs, getBlog } from '@/lib/contentful/api/blog';
import { getAllPages, getPage } from '@/lib/contentful/api/page';
import { getAllProjects, getProject } from '@/lib/contentful/api/portfolio';
import { richTextToMarkdown } from '@/lib/contentful/rich-text-markdown';
import { tags } from '@/lib/cache/tags';
import { SITE_AUTHOR, SITE_NAME, SITE_URL } from '@/lib/constants';
import type { BlogProps } from '@/lib/contentful/api/props/blog';
import type { PageProps } from '@/lib/contentful/api/props/page';
import type { PortfolioProps } from '@/lib/contentful/api/props/portfolio';

/**
 * Everything the AI-facing routes share: the site summary, the content lists
 * behind /llms.txt, and the Markdown rendering behind the `.md` routes and
 * /llms-full.txt. Content comes straight from the Contentful helpers the
 * pages use, so there is nothing to keep in sync by hand; the `content`
 * cache profile plus the Contentful webhook keep every route current.
 */

export const SITE_SUMMARY =
  'Personal site of Simon Krüger: essays on engineering leadership, AI and software craft, a portfolio of projects, and a specialty-coffee log.';

/** Slugs come from URLs; keep them boring before they reach a GraphQL query. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export type MarkdownKind = 'blog' | 'page' | 'portfolio';

const PAGE_SIZE = 9;
const MAX_PAGES = 50;

export async function getAllBlogPosts(): Promise<BlogProps[]> {
  'use cache';
  cacheLife('content');
  cacheTag(tags.content.blogPosts);

  const first = await getAllBlogs(1, PAGE_SIZE);
  const totalPages = Math.min(MAX_PAGES, Math.ceil(first.total / PAGE_SIZE));
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) =>
      getAllBlogs(i + 2, PAGE_SIZE)
    )
  );
  return [first, ...rest].flatMap((c) => c.items as unknown as BlogProps[]);
}

export async function getPublishedPages(): Promise<PageProps[]> {
  'use cache';
  cacheLife('content');
  cacheTag(tags.content.pages);
  return ((await getAllPages()) as PageProps[]) ?? [];
}

export async function getProjects(): Promise<PortfolioProps[]> {
  'use cache';
  cacheLife('content');
  cacheTag(tags.content.portfolioProjects);
  return (await getAllProjects()).items;
}

export const htmlUrl = (kind: MarkdownKind, slug: string) =>
  `${SITE_URL}/${kind}/${slug}`;
export const markdownUrl = (kind: MarkdownKind, slug: string) =>
  `${htmlUrl(kind, slug)}.md`;

const oneLine = (s: string | undefined | null) =>
  (s ?? '').replace(/\s+/g, ' ').trim();
const isoDate = (s: string | Date | undefined | null) =>
  s ? new Date(s).toISOString().slice(0, 10) : undefined;

function frontMatter(lines: Array<[string, string | undefined]>): string {
  return lines
    .filter((l): l is [string, string] => Boolean(l[1]))
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');
}

export function blogPostToMarkdown(post: BlogProps): string {
  const categories = post.categoriesCollection?.items
    ?.map((c) => c.title)
    .filter(Boolean)
    .join(', ');
  return [
    `# ${post.title}`,
    post.summary ? `> ${oneLine(post.summary)}` : '',
    frontMatter([
      ['Author', post.author || SITE_AUTHOR],
      ['Published', isoDate(post.sys.firstPublishedAt)],
      ['Updated', isoDate(post.sys.publishedAt)],
      ['Categories', categories || undefined],
      ['Canonical', htmlUrl('blog', post.slug)],
    ]),
    post.heroImage?.url ? `![${escape(post.title)}](${post.heroImage.url})` : '',
    // Despite its name, `authorText` is the article's lead paragraph, shown
    // under the hero on the page.
    oneLine(post.authorText),
    richTextToMarkdown(post.details?.json, post.details?.links).trim(),
  ]
    .filter(Boolean)
    .join('\n\n')
    .concat('\n');
}

export function pageToMarkdown(page: PageProps): string {
  return [
    `# ${page.title}`,
    frontMatter([
      ['Updated', isoDate(page.date)],
      ['Canonical', htmlUrl('page', page.slug)],
    ]),
    richTextToMarkdown(page.details?.json, page.details?.links).trim(),
  ]
    .filter(Boolean)
    .join('\n\n')
    .concat('\n');
}

export function projectToMarkdown(project: PortfolioProps): string {
  return [
    `# ${project.title}`,
    project.summary ? `> ${oneLine(project.summary)}` : '',
    frontMatter([
      ['Published', isoDate(project.sys.firstPublishedAt)],
      ['Updated', isoDate(project.sys.publishedAt)],
      ['Website', project.url ?? undefined],
      ['Source', project.githubUrl ?? undefined],
      ['Canonical', htmlUrl('portfolio', project.slug)],
    ]),
    richTextToMarkdown(
      project.description?.json,
      project.description?.links
    ).trim(),
  ]
    .filter(Boolean)
    .join('\n\n')
    .concat('\n');
}

/** Markdown for one page, or null when the slug does not resolve. */
export async function renderMarkdown(
  kind: MarkdownKind,
  slug: string
): Promise<string | null> {
  if (!SLUG_PATTERN.test(slug)) return null;
  switch (kind) {
    case 'blog': {
      const post = (await getBlog(slug).catch(() => null)) as BlogProps | null;
      return post ? blogPostToMarkdown(post) : null;
    }
    case 'page': {
      const page = (await getPage(slug)) as PageProps | undefined;
      return page ? pageToMarkdown(page) : null;
    }
    case 'portfolio': {
      const project = await getProject(slug);
      return project ? projectToMarkdown(project) : null;
    }
  }
}

/** The /llms.txt index. */
export async function buildLlmsIndex(): Promise<string> {
  'use cache';
  cacheLife('content');
  cacheTag(
    tags.content.blogPosts,
    tags.content.pages,
    tags.content.portfolioProjects
  );

  const [posts, pages, projects] = await Promise.all([
    getAllBlogPosts(),
    getPublishedPages(),
    getProjects(),
  ]);

  const entry = (title: string, url: string, note?: string) =>
    `- [${escape(title)}](${url})${note ? `: ${oneLine(note)}` : ''}`;

  return [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_SUMMARY}`,
    '',
    `Written by ${SITE_AUTHOR}. Every page listed here is also served as plain Markdown at the linked \`.md\` URL; the whole site in one file is at ${SITE_URL}/llms-full.txt.`,
    '',
    '## Blog',
    '',
    ...posts.map((p) =>
      entry(p.title, markdownUrl('blog', p.slug), p.seoDescription || p.summary)
    ),
    '',
    '## Portfolio',
    '',
    ...projects.map((p) =>
      entry(p.title, markdownUrl('portfolio', p.slug), p.summary)
    ),
    '',
    '## Pages',
    '',
    ...pages.map((p) => entry(p.title, markdownUrl('page', p.slug))),
    '',
    '## Optional',
    '',
    entry('Coffee log', `${SITE_URL}/coffee`, 'Specialty coffees I have brewed, by origin and roaster'),
    entry('RSS feed', `${SITE_URL}/rss.xml`),
    entry('Sitemap', `${SITE_URL}/sitemap.xml`),
    '',
  ].join('\n');
}

/** The /llms-full.txt corpus: every page's Markdown, separated by rules. */
export async function buildLlmsFull(): Promise<string> {
  'use cache';
  cacheLife('content');
  cacheTag(
    tags.content.blogPosts,
    tags.content.pages,
    tags.content.portfolioProjects
  );

  const [posts, pages, projects] = await Promise.all([
    getAllBlogPosts(),
    getPublishedPages(),
    getProjects(),
  ]);
  // The list query omits the rich-text description (Contentful complexity
  // limit), so fetch each project in full for its body.
  const fullProjects = (
    await Promise.all(projects.map((p) => getProject(p.slug)))
  ).filter((p): p is PortfolioProps => p !== null);

  const sections = [
    ...pages.map(pageToMarkdown),
    ...posts.map(blogPostToMarkdown),
    ...fullProjects.map(projectToMarkdown),
  ];

  return [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_SUMMARY}`,
    '',
    `Full text of ${SITE_URL}. Index: ${SITE_URL}/llms.txt.`,
    '',
    '---',
    '',
    sections.join('\n---\n\n'),
  ].join('\n');
}

function escape(s: string): string {
  return s.replace(/[[\]]/g, '\\$&');
}
