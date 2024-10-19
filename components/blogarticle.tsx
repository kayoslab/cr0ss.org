import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import Image from 'next/image';
import { BlogProps } from '@/lib/contentful/api/props/blog';
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
        return <ul className="list-disc dark:text-slate-200 list-style-position:outside ms-4">{children}</ul>;
      },
      [BLOCKS.LIST_ITEM]: (node: any, children: any) => {
        return <li className="my-4 list-style-position:outside ms-4">{children}</li>;
      },
      [BLOCKS.OL_LIST]: (node: any, children: any) => {
        return <li className="my-4 list-style-position:outside ms-4">{children}</li>;
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
        return (
          <Link href={asset.url} >
            <img src={asset.url} alt={asset.description} />
          </Link>
        );
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

export const Blog = ({ blog }: { blog: BlogProps }) => {

  return (
    <section className='w-full max-w-screen-lg'>
        <div className='container space-y-12 px-4 md:px-6'>
          <div className='space-y-4'>
            <h1
              className='text-4xl font-bold tracking-tighter sm:text-5xl'
            >
              {blog.title}
            </h1>
            <div
              className='text-zinc-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed'
            >
              By  <Link href={`/page/about`}>{"cr0ss"}</Link>
            </div>
          </div>
          <div className='space-y-8 lg:space-y-10'>
            <Image
              alt='Blog Image'
              className='aspect-video w-full overflow-hidden rounded-xl object-cover'
              src={blog.heroImage?.url as string}
              width={0}
              height={0}
              sizes="100vw"
              style={{ width: '100%', height: 'auto' }} // optional
            />
            {/* <div className="space-y-8 lg:space-y-10"> */}
            <div className='flex flex-col justify-between md:flex-row'>
              <p
                className='max-w-[900px] text-zinc-500 md:text-2xl lg:text-3xl xl:text-4xl dark:text-zinc-400'
              >
                {blog.summary}
              </p>
            </div>
            <div className='space-y-4 md:space-y-6'>
              <div className='space-y-2'>
                <div
                  className='prose max-w-[900px] text-zinc-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-zinc-400'
                >
                  {documentToReactComponents(
                    blog.details.json,
                    renderOptions(blog.details.links)
                  )}
                </div>
              </div>
            </div>
            <div className='flex flex-col justify-between md:flex-row'>
              <blockquote className="max-w-[900px] text-xl italic font-semibold text-gray-900 dark:text-white">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-600 mb-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 14">
                    <path d="M6 0H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3H2a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3h-1a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Z"/>
                </svg>
                <p>{ blog.authorText }</p>
            </blockquote>
            </div>
          </div>
        </div>
      </section>
  );
};