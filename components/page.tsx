import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import Image from 'next/image';
import { PageProps } from '@/lib/contentful/api/props/page';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';
import Link from 'next/link';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

function renderOptions(links: any) {
  // create an asset map
  const assetMap = new Map();
  // loop through the assets and add them to the map
  for (const asset of links.assets.block) {
    assetMap.set(asset.sys.id, asset);
  }

  return {
    renderNode: {
      [BLOCKS.HEADING_1]: (node: any, children: any) => {
        return <h1 className="font-bold text-5xl mb-4 dark:text-white">{children}</h1>;
      },
      [BLOCKS.HEADING_2]: (node: any, children: any) => {
        return <h2 className="font-bold text-2xl mb-4 dark:text-white">{children}</h2>;
      },
      [BLOCKS.HEADING_3]: (node: any, children: any) => {
        return <h3 className="font-bold text-xl mb-4 dark:text-white">{children}</h3>;
      },
      [BLOCKS.HEADING_4]: (node: any, children: any) => {
        return <h4 className="font-bold text-lg mb-4 dark:text-white">{children}</h4>;
      },
      [BLOCKS.HEADING_5]: (node: any, children: any) => {
        return <h5 className="font-bold text-lg mb-4 dark:text-white">{children}</h5>;
      },
      [BLOCKS.HEADING_6]: (node: any, children: any) => {
        return <h6 className="font-bold text-lg mb-4 dark:text-white">{children}</h6>;
      },
      [BLOCKS.UL_LIST]: (node: any, children: any) => {
        return <ul className="list-disc dark:text-slate-200">{children}</ul>;
      },
      [BLOCKS.LIST_ITEM]: (node: any, children: any) => {
        return <li className="my-4">{children}</li>;
      },
      [BLOCKS.OL_LIST]: (node: any, children: any) => {
        return <li className="my-4">{children}</li>;
      },
      [BLOCKS.PARAGRAPH]: (node: any, children: any) => {
        return <p className="mb-2 text-slate-700 dark:text-slate-200">{children}</p>;
      },
      [BLOCKS.TABLE]: (node: any, children: any) => {
        return (
          <table>
            <tbody>{children}</tbody>
          </table>
        );
      },
      [BLOCKS.EMBEDDED_ASSET]: (node: any) => {
        // find the asset in the assetMap by ID
        const asset = assetMap.get(node.data.target.sys.id);

        // render the asset accordingly
        return <img src={asset.url} alt={asset.description} />;
      },
    },
    [INLINES.HYPERLINK]: (node: any, children: any) => {
      return (
        <Link href={node.data.uri} className="text-blue-600 hover:underline" style={{ wordWrap: "break-word" }}>
          {children}
        </Link>
      );
    },
    [BLOCKS.EMBEDDED_ENTRY]: (node: any, children: any) => {
      // node.data.fields holds description, language, code
      const { codeSnippet, language } = node.data.target.fields;
      return (
        <SyntaxHighlighter
         style={vscDarkPlus}
         language={language}>
          {codeSnippet}
        </SyntaxHighlighter>
      );
    },
  };
}

export const Page = ({ page }: { page: PageProps }) => {
  return (
    <div className='flex min-h-screen flex-col items-center justify-between bg-white p-24'>
      <section className='w-full'>
        <div className='container space-y-12 px-4 md:px-6'>
          <div className='space-y-4'>
            <h1
              className='text-4xl font-bold tracking-tighter sm:text-5xl'
            >
              {page.title}
            </h1>
          </div>
          <div className='space-y-8 lg:space-y-10'>
            <Image
              alt='Page Image'
              className='aspect-video w-full overflow-hidden rounded-xl object-cover'
              height='365'
              src={page.heroImage?.url as string}
              width='650'
            />
            <div className='space-y-4 md:space-y-6'>
              <div className='space-y-2'>
                <div
                  className='prose max-w-[900px] text-zinc-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-zinc-400'
                >
                  {documentToReactComponents(
                    page.details.json,
                    renderOptions(page.details.links)
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};