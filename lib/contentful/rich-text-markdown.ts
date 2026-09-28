import {
  BLOCKS,
  INLINES,
  MARKS,
  type Block,
  type Document,
  type Inline,
  type Text,
} from '@contentful/rich-text-types';
import type { ContentfulAsset, ContentfulLinks } from './rich-text-renderer';

/**
 * Contentful rich text → GitHub-flavoured Markdown.
 *
 * Mirrors what `createRichTextOptions` renders to HTML (headings, lists,
 * quotes, tables, embedded images and CodeSnippet entries, hyperlinks) so the
 * `.md` routes and llms-full.txt carry the same content as the pages, minus
 * the chrome.
 */

type Node = Block | Inline | Text;

interface Context {
  assets: Map<string, ContentfulAsset>;
  entries: Map<string, { __typename: string; codeSnippet?: string; language?: string }>;
}

export function richTextToMarkdown(
  document: Document | undefined | null,
  links?: ContentfulLinks | null
): string {
  if (!document?.content) return '';
  const ctx: Context = {
    assets: new Map(links?.assets?.block?.map((a) => [a.sys.id, a]) ?? []),
    entries: new Map(links?.entries?.block?.map((e) => [e.sys.id, e]) ?? []),
  };
  const body = renderBlocks(document.content as Node[], ctx);
  return body ? `${body}\n` : '';
}

function renderBlocks(nodes: Node[], ctx: Context): string {
  return nodes
    .map((node) => renderBlock(node, ctx))
    .filter((s) => s !== '')
    .join('\n\n');
}

function renderBlock(node: Node, ctx: Context): string {
  switch (node.nodeType) {
    case BLOCKS.PARAGRAPH:
      return renderInlines(children(node), ctx).trim();
    case BLOCKS.HEADING_1:
    case BLOCKS.HEADING_2:
    case BLOCKS.HEADING_3:
    case BLOCKS.HEADING_4:
    case BLOCKS.HEADING_5:
    case BLOCKS.HEADING_6: {
      const level = Number(node.nodeType.slice(-1));
      return `${'#'.repeat(level)} ${renderInlines(children(node), ctx).trim()}`;
    }
    case BLOCKS.QUOTE:
      return prefixLines(renderBlocks(children(node), ctx), '> ');
    case BLOCKS.UL_LIST:
      return renderList(children(node), ctx, () => '- ');
    case BLOCKS.OL_LIST:
      return renderList(children(node), ctx, (i) => `${i + 1}. `);
    case BLOCKS.HR:
      return '---';
    case BLOCKS.TABLE:
      return renderTable(children(node), ctx);
    case BLOCKS.EMBEDDED_ASSET: {
      const asset = ctx.assets.get(targetId(node));
      if (!asset) return '';
      const alt = asset.description || asset.title || asset.fileName || '';
      return `![${escapeBrackets(alt)}](${asset.url})`;
    }
    case BLOCKS.EMBEDDED_ENTRY: {
      const entry = ctx.entries.get(targetId(node));
      if (entry?.__typename !== 'CodeSnippet' || !entry.codeSnippet) return '';
      const lang = entry.language?.toLowerCase() ?? '';
      return `\`\`\`${lang}\n${entry.codeSnippet.replace(/\n$/, '')}\n\`\`\``;
    }
    default:
      // Unknown block: flatten to whatever it contains.
      return 'content' in node
        ? renderBlocks(children(node), ctx)
        : renderInlines([node], ctx);
  }
}

function renderList(
  items: Node[],
  ctx: Context,
  marker: (index: number) => string
): string {
  return items
    .map((item, i) => {
      const m = marker(i);
      const body = renderBlocks(children(item), ctx);
      const [first = '', ...rest] = body.split('\n');
      const indent = ' '.repeat(m.length);
      return [m + first, ...rest.map((l) => (l ? indent + l : l))].join('\n');
    })
    .join('\n');
}

function renderTable(rows: Node[], ctx: Context): string {
  const cells = rows.map((row) =>
    children(row).map((cell) =>
      renderBlocks(children(cell), ctx).replace(/\s*\n\s*/g, ' ').trim()
    )
  );
  if (cells.length === 0) return '';
  const width = Math.max(...cells.map((r) => r.length));
  const line = (r: string[]) =>
    `| ${Array.from({ length: width }, (_, i) => r[i] ?? '').join(' | ')} |`;
  // GFM needs a header row; Contentful's first row is the header when it
  // uses header cells, and reads fine as one otherwise.
  const [head, ...body] = cells;
  return [line(head), `| ${Array(width).fill('---').join(' | ')} |`, ...body.map(line)].join('\n');
}

function renderInlines(nodes: Node[], ctx: Context): string {
  return nodes.map((n) => renderInline(n, ctx)).join('');
}

function renderInline(node: Node, ctx: Context): string {
  switch (node.nodeType) {
    case 'text':
      return applyMarks(node as Text);
    case INLINES.HYPERLINK: {
      const uri = (node as Inline).data?.uri as string | undefined;
      const text = renderInlines(children(node), ctx);
      return uri ? `[${text}](${uri})` : text;
    }
    case INLINES.ASSET_HYPERLINK: {
      const asset = ctx.assets.get(targetId(node));
      const text = renderInlines(children(node), ctx);
      return asset ? `[${text}](${asset.url})` : text;
    }
    case INLINES.ENTRY_HYPERLINK:
      return renderInlines(children(node), ctx);
    case INLINES.EMBEDDED_ENTRY:
      return '';
    default:
      return 'content' in node ? renderInlines(children(node), ctx) : '';
  }
}

function applyMarks(text: Text): string {
  let value = text.value;
  if (!value) return '';
  const marks = new Set(text.marks?.map((m) => m.type));
  if (marks.has(MARKS.CODE)) return `\`${value}\``;
  if (marks.has(MARKS.BOLD)) value = `**${value}**`;
  if (marks.has(MARKS.ITALIC)) value = `_${value}_`;
  if (marks.has(MARKS.STRIKETHROUGH)) value = `~~${value}~~`;
  return value;
}

function children(node: Node): Node[] {
  return ('content' in node ? node.content : []) as Node[];
}

function targetId(node: Node): string {
  return ((node as Block).data?.target?.sys?.id as string | undefined) ?? '';
}

function prefixLines(text: string, prefix: string): string {
  return text
    .split('\n')
    .map((l) => (l ? prefix + l : prefix.trimEnd()))
    .join('\n');
}

function escapeBrackets(s: string): string {
  return s.replace(/[[\]]/g, '\\$&');
}
