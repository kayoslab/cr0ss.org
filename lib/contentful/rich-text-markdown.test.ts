import { describe, it, expect } from 'vitest';
import {
  BLOCKS,
  INLINES,
  MARKS,
  type Document,
} from '@contentful/rich-text-types';
import { richTextToMarkdown } from './rich-text-markdown';
import type { ContentfulLinks } from './rich-text-renderer';

const text = (value: string, marks: string[] = []) => ({
  nodeType: 'text' as const,
  value,
  marks: marks.map((type) => ({ type })),
  data: {},
});
const block = (nodeType: string, content: unknown[], data = {}) => ({
  nodeType,
  content,
  data,
});
const paragraph = (...content: unknown[]) => block(BLOCKS.PARAGRAPH, content);
const doc = (...content: unknown[]) =>
  ({ nodeType: BLOCKS.DOCUMENT, data: {}, content }) as unknown as Document;

describe('richTextToMarkdown', () => {
  it('returns an empty string for missing content', () => {
    expect(richTextToMarkdown(undefined)).toBe('');
    expect(richTextToMarkdown(null)).toBe('');
  });

  it('renders headings, paragraphs and inline marks', () => {
    const md = richTextToMarkdown(
      doc(
        block(BLOCKS.HEADING_2, [text('Title')]),
        paragraph(
          text('Plain '),
          text('bold', [MARKS.BOLD]),
          text(' and '),
          text('italic', [MARKS.ITALIC]),
          text(' and '),
          text('code', [MARKS.CODE, MARKS.BOLD])
        )
      )
    );

    expect(md).toBe('## Title\n\nPlain **bold** and _italic_ and `code`\n');
  });

  it('renders links, nested lists and quotes', () => {
    const md = richTextToMarkdown(
      doc(
        block(BLOCKS.OL_LIST, [
          block(BLOCKS.LIST_ITEM, [
            paragraph(
              text('See '),
              block(INLINES.HYPERLINK, [text('docs')], {
                uri: 'https://example.com',
              })
            ),
            block(BLOCKS.UL_LIST, [
              block(BLOCKS.LIST_ITEM, [paragraph(text('nested'))]),
            ]),
          ]),
          block(BLOCKS.LIST_ITEM, [paragraph(text('second'))]),
        ]),
        block(BLOCKS.QUOTE, [
          paragraph(text('quoted')),
          paragraph(text('twice')),
        ])
      )
    );

    expect(md).toBe(
      [
        '1. See [docs](https://example.com)',
        '',
        '   - nested',
        '2. second',
        '',
        '> quoted',
        '>',
        '> twice',
        '',
      ].join('\n')
    );
  });

  it('renders embedded images and code snippets from links', () => {
    const links: ContentfulLinks = {
      assets: {
        block: [
          {
            sys: { id: 'img1' },
            url: 'https://images.ctfassets.net/x/y.png',
            title: 'A [photo]',
          },
        ],
      },
      entries: {
        block: [
          {
            sys: { id: 'code1' },
            __typename: 'CodeSnippet',
            language: 'TypeScript',
            codeSnippet: 'const a = 1;\n',
          },
        ],
      },
    };
    const md = richTextToMarkdown(
      doc(
        block(BLOCKS.EMBEDDED_ASSET, [], { target: { sys: { id: 'img1' } } }),
        block(BLOCKS.EMBEDDED_ENTRY, [], { target: { sys: { id: 'code1' } } }),
        block(BLOCKS.EMBEDDED_ASSET, [], { target: { sys: { id: 'missing' } } })
      ),
      links
    );

    expect(md).toBe(
      '![A \\[photo\\]](https://images.ctfassets.net/x/y.png)\n\n```typescript\nconst a = 1;\n```\n'
    );
  });

  it('renders tables with a GFM header separator', () => {
    const cell = (type: string, value: string) =>
      block(type, [paragraph(text(value))]);
    const md = richTextToMarkdown(
      doc(
        block(BLOCKS.TABLE, [
          block(BLOCKS.TABLE_ROW, [
            cell(BLOCKS.TABLE_HEADER_CELL, 'Name'),
            cell(BLOCKS.TABLE_HEADER_CELL, 'Value'),
          ]),
          block(BLOCKS.TABLE_ROW, [
            cell(BLOCKS.TABLE_CELL, 'a'),
            cell(BLOCKS.TABLE_CELL, '1'),
          ]),
        ])
      )
    );

    expect(md).toBe('| Name | Value |\n| --- | --- |\n| a | 1 |\n');
  });
});
