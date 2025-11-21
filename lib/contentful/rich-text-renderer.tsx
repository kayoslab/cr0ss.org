import { Options } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES, Block, Inline } from '@contentful/rich-text-types';
import Link from 'next/link';
import Image from 'next/image';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * Type definitions for Contentful rich-text content
 */
export interface ContentfulAsset {
  sys: {
    id: string;
  };
  url: string;
  title?: string;
  description?: string;
  fileName?: string;
}

export interface ContentfulCodeSnippet {
  sys: {
    id: string;
  };
  __typename: string;
  codeSnippet: string;
  language: string;
}

export interface ContentfulLinks {
  assets: {
    block: ContentfulAsset[];
  };
  entries?: {
    block?: ContentfulCodeSnippet[];
  };
}

export interface RichTextStyleConfig {
  heading1?: string;
  heading2?: string;
  heading3?: string;
  heading4?: string;
  heading5?: string;
  heading6?: string;
  paragraph?: string;
  quote?: string;
  ulList?: string;
  olList?: string;
  listItem?: string;
  hyperlink?: string;
}

/**
 * Default styles for blog articles
 */
export const BLOG_ARTICLE_STYLES: RichTextStyleConfig = {
  heading1: 'font-bold text-5xl mt-12 mb-6',
  heading2: 'font-bold text-3xl mt-10 mb-5',
  heading3: 'font-bold text-2xl mt-8 mb-4',
  heading4: 'font-bold text-xl mt-6 mb-3',
  heading5: 'font-bold text-lg mt-6 mb-3',
  heading6: 'font-bold text-base mt-6 mb-3',
  paragraph: 'mb-6 leading-relaxed text-slate-700',
  quote: 'border-l-4 border-gray-300 pl-4 my-6 italic text-gray-700',
  ulList: 'list-disc list-style-position:outside ms-4',
  olList: 'list-decimal list-style-position:outside ms-4',
  listItem: 'my-4 list-style-position:outside ms-4',
  hyperlink: 'text-gray-700 underline decoration-gray-700/30 hover:decoration-gray-700:decoration-gray-300 transition-all duration-200',
};

/**
 * Default styles for regular pages
 */
export const PAGE_STYLES: RichTextStyleConfig = {
  heading1: 'font-bold text-5xl mt-12 mb-6',
  heading2: 'font-bold text-3xl mt-10 mb-5',
  heading3: 'font-bold text-2xl mt-8 mb-4',
  heading4: 'font-bold text-xl mt-6 mb-3',
  heading5: 'font-bold text-lg mt-6 mb-3',
  heading6: 'font-bold text-base mt-6 mb-3',
  paragraph: 'mb-6 leading-relaxed text-slate-700',
  quote: 'border-l-4 border-gray-300 pl-4 my-6 italic text-gray-700',
  ulList: 'list-disc list-style-position:outside ms-4',
  olList: 'list-decimal list-style-position:outside ms-4',
  listItem: 'my-4 list-style-position:outside ms-4',
  hyperlink: 'text-gray-700 underline decoration-gray-700/30 hover:decoration-gray-700:decoration-gray-300 transition-all duration-200',
};

/**
 * Creates rich-text rendering options for Contentful content
 * @param links - Contentful links object containing assets and entries
 * @param styles - Custom style configuration
 * @param options - Additional options for rendering
 */
export function createRichTextOptions(
  links: ContentfulLinks,
  styles: RichTextStyleConfig = BLOG_ARTICLE_STYLES,
  options: { enableCodeSnippets?: boolean } = { enableCodeSnippets: true }
): Options {
  // Create an asset map for quick lookups
  const assetMap = new Map<string, ContentfulAsset>();
  if (links?.assets?.block) {
    for (const asset of links.assets.block) {
      assetMap.set(asset.sys.id, asset);
    }
  }

  const renderNode: Options['renderNode'] = {
    [BLOCKS.HEADING_1]: (node: Block | Inline, children: React.ReactNode) => {
      return <h1 className={styles.heading1}>{children}</h1>;
    },
    [BLOCKS.HEADING_2]: (node: Block | Inline, children: React.ReactNode) => {
      return <h2 className={styles.heading2}>{children}</h2>;
    },
    [BLOCKS.HEADING_3]: (node: Block | Inline, children: React.ReactNode) => {
      return <h3 className={styles.heading3}>{children}</h3>;
    },
    [BLOCKS.HEADING_4]: (node: Block | Inline, children: React.ReactNode) => {
      return <h4 className={styles.heading4}>{children}</h4>;
    },
    [BLOCKS.HEADING_5]: (node: Block | Inline, children: React.ReactNode) => {
      return <h5 className={styles.heading5}>{children}</h5>;
    },
    [BLOCKS.HEADING_6]: (node: Block | Inline, children: React.ReactNode) => {
      return <h6 className={styles.heading6}>{children}</h6>;
    },
    [BLOCKS.PARAGRAPH]: (node: Block | Inline, children: React.ReactNode) => {
      return <p className={styles.paragraph}>{children}</p>;
    },
    [BLOCKS.QUOTE]: (node: Block | Inline, children: React.ReactNode) => {
      return <blockquote className={styles.quote}>{children}</blockquote>;
    },
    [BLOCKS.UL_LIST]: (node: Block | Inline, children: React.ReactNode) => {
      return <ul className={styles.ulList}>{children}</ul>;
    },
    [BLOCKS.OL_LIST]: (node: Block | Inline, children: React.ReactNode) => {
      return <ol className={styles.olList}>{children}</ol>;
    },
    [BLOCKS.LIST_ITEM]: (node: Block | Inline, children: React.ReactNode) => {
      return <li className={styles.listItem}>{children}</li>;
    },
    [BLOCKS.TABLE]: (node: Block | Inline, children: React.ReactNode) => {
      return (
        <table>
          <tbody>{children}</tbody>
        </table>
      );
    },
    [BLOCKS.EMBEDDED_ASSET]: (node: Block | Inline) => {
      const assetId = (node as Block).data?.target?.sys?.id;
      if (!assetId) return null;

      const asset = assetMap.get(assetId);
      if (!asset) {
        console.warn('Asset not found:', assetId);
        return null;
      }

      return (
        <Link href={asset.url}>
          <Image
            src={asset.url}
            alt={asset.description || asset.title || 'Embedded asset'}
            width={800}
            height={600}
            className="w-full h-auto"
          />
        </Link>
      );
    },
    [BLOCKS.EMBEDDED_ENTRY]: (node: Block | Inline) => {
      if (!options.enableCodeSnippets) return null;

      const entryId = (node as Block).data?.target?.sys?.id;
      if (!entryId) return null;

      // Find the entry in the links
      const entry = links?.entries?.block?.find(
        (entry) => entry?.sys?.id === entryId
      );

      if (!entry) {
        console.warn('Entry not found:', entryId);
        return null;
      }

      // Check if it's a code snippet content type
      if (entry.__typename === 'CodeSnippet') {
        const { codeSnippet, language } = entry;
        return (
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={language?.toLowerCase() || 'text'}
            showLineNumbers={true}
            wrapLines={true}
            customStyle={{
              margin: '2em 0',
              padding: '1em',
              borderRadius: '0.5em',
            }}
          >
            {codeSnippet}
          </SyntaxHighlighter>
        );
      }

      return null;
    },
    [INLINES.HYPERLINK]: (node: Block | Inline, children: React.ReactNode) => {
      const uri = (node as Inline).data?.uri;
      if (!uri) return <>{children}</>;

      const isExternal = uri.startsWith('http');
      return (
        <Link
          href={uri}
          className={styles.hyperlink}
          target={isExternal ? '_blank' : '_self'}
          rel={isExternal ? 'noopener noreferrer' : ''}
          style={{ wordWrap: 'break-word' }}
        >
          {children}
        </Link>
      );
    },
  };

  return { renderNode };
}
