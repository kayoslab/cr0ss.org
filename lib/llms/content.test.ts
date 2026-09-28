import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BLOCKS } from '@contentful/rich-text-types';
import type { BlogProps } from '@/lib/contentful/api/props/blog';
import type { PortfolioProps } from '@/lib/contentful/api/props/portfolio';

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock('@/lib/contentful/api/blog', () => ({
  getAllBlogs: vi.fn(),
  getBlog: vi.fn(),
}));
vi.mock('@/lib/contentful/api/page', () => ({
  getAllPages: vi.fn(),
  getPage: vi.fn(),
}));
vi.mock('@/lib/contentful/api/portfolio', () => ({
  getAllProjects: vi.fn(),
  getProject: vi.fn(),
}));

import { getAllBlogs, getBlog } from '@/lib/contentful/api/blog';
import { getAllPages, getPage } from '@/lib/contentful/api/page';
import { getAllProjects, getProject } from '@/lib/contentful/api/portfolio';
import {
  blogPostToMarkdown,
  buildLlmsFull,
  buildLlmsIndex,
  renderMarkdown,
} from './content';

const body = (value: string) => ({
  json: {
    nodeType: BLOCKS.DOCUMENT,
    data: {},
    content: [
      {
        nodeType: BLOCKS.PARAGRAPH,
        data: {},
        content: [{ nodeType: 'text', value, marks: [], data: {} }],
      },
    ],
  },
  links: { assets: { block: [] } },
});

const post = {
  sys: {
    id: 'p1',
    firstPublishedAt: '2026-07-10T11:10:07.113Z',
    publishedAt: '2026-07-10T11:27:04.125Z',
  },
  slug: 'hello-world',
  title: 'Hello [World]',
  author: 'Simon Krüger',
  authorText: 'Lead paragraph shown under the hero.',
  summary: 'A first   post\nwith line breaks.',
  seoDescription: 'SEO summary',
  seoKeywords: [],
  categoriesCollection: { items: [{ title: 'Tech', slug: 'tech' }] },
  heroImage: { sys: { id: 'h' }, url: 'https://images.ctfassets.net/h.png' },
  details: body('Body text.'),
} as unknown as BlogProps & Record<string, unknown>;

const project = {
  sys: { id: 'x', firstPublishedAt: '2026-01-01T00:00:00Z', publishedAt: '2026-02-01T00:00:00Z' },
  slug: 'swag-store',
  title: 'Swag Store',
  summary: 'A shop.',
  url: 'https://shop.example',
  githubUrl: null,
  description: body('Project body.'),
} as unknown as PortfolioProps;

const page = {
  sys: { id: 'pg' },
  slug: 'about',
  title: 'About',
  date: '2026-03-01T00:00:00Z',
  details: body('About text.'),
};

beforeEach(() => {
  vi.mocked(getAllBlogs).mockResolvedValue({
    items: [post],
    total: 1,
    skip: 0,
    limit: 9,
  });
  vi.mocked(getAllPages).mockResolvedValue([page]);
  vi.mocked(getAllProjects).mockResolvedValue({
    items: [project],
    total: 1,
    skip: 0,
    limit: 100,
  });
  vi.mocked(getBlog).mockResolvedValue(post);
  vi.mocked(getPage).mockResolvedValue(page);
  vi.mocked(getProject).mockResolvedValue(project);
});

describe('blogPostToMarkdown', () => {
  it('renders title, summary, metadata, hero and body', () => {
    expect(blogPostToMarkdown(post)).toBe(
      [
        '# Hello [World]',
        '',
        '> A first post with line breaks.',
        '',
        '- Author: Simon Krüger',
        '- Published: 2026-07-10',
        '- Updated: 2026-07-10',
        '- Categories: Tech',
        '- Canonical: https://cr0ss.org/blog/hello-world',
        '',
        '![Hello \\[World\\]](https://images.ctfassets.net/h.png)',
        '',
        'Lead paragraph shown under the hero.',
        '',
        'Body text.',
        '',
      ].join('\n')
    );
  });
});

describe('buildLlmsIndex', () => {
  it('follows the llms.txt shape and links every entry to its .md URL', async () => {
    const index = await buildLlmsIndex();
    const lines = index.split('\n');

    expect(lines[0]).toBe('# cr0ss.mind');
    expect(lines[2]).toMatch(/^> /);
    expect(index).toContain('## Blog\n\n- [Hello \\[World\\]](https://cr0ss.org/blog/hello-world.md): SEO summary');
    expect(index).toContain('## Portfolio\n\n- [Swag Store](https://cr0ss.org/portfolio/swag-store.md): A shop.');
    expect(index).toContain('## Pages\n\n- [About](https://cr0ss.org/page/about.md)');
    expect(index).toContain('## Optional');
  });
});

describe('buildLlmsFull', () => {
  it('concatenates pages, posts and full projects', async () => {
    const full = await buildLlmsFull();

    expect(full.indexOf('# About')).toBeGreaterThan(0);
    expect(full.indexOf('# Hello [World]')).toBeGreaterThan(full.indexOf('# About'));
    expect(full.indexOf('# Swag Store')).toBeGreaterThan(full.indexOf('# Hello [World]'));
    expect(full).toContain('Project body.');
    expect(getProject).toHaveBeenCalledWith('swag-store');
  });
});

describe('renderMarkdown', () => {
  it('rejects slugs that are not plain kebab-case', async () => {
    expect(await renderMarkdown('blog', 'a"b')).toBeNull();
    expect(await renderMarkdown('page', '../etc')).toBeNull();
    expect(getBlog).not.toHaveBeenCalled();
  });

  it('returns null for unknown content and markdown for known content', async () => {
    vi.mocked(getBlog).mockRejectedValueOnce(new Error('not found'));
    expect(await renderMarkdown('blog', 'missing')).toBeNull();

    expect(await renderMarkdown('portfolio', 'swag-store')).toContain(
      '- Website: https://shop.example'
    );
    expect(await renderMarkdown('page', 'about')).toContain('About text.');
  });
});
