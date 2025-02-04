import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import Image from 'next/image';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';
import Link from 'next/link';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CategoryProps } from '@/lib/contentful/api/props/category';

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
        return <ul className="list-disc dark:text-slate-200 list-style-position:outside ms-4" key={children}>{children}</ul>;
      },
      [BLOCKS.LIST_ITEM]: (node: any, children: any) => {
        return <li className="my-4 list-style-position:outside ms-4" key={children}>{children}</li>;
      },
      [BLOCKS.OL_LIST]: (node: any, children: any) => {
        return <ol className="list-decimal dark:text-slate-200 list-style-position:outside ms-4" key={children}>{children}</ol>;
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
      [BLOCKS.EMBEDDED_ENTRY]: (node: any) => {
        // Get the entry from the links
        const entry = links?.entries?.block?.find((entry: any) => 
          entry?.sys?.id === node?.data?.target?.sys?.id
        );
        
        if (!entry) {
          console.warn('Entry not found:', node?.data?.target?.sys?.id);
          return null;
        }

        // Check if it's a code snippet content type using __typename
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
              }}>
              {codeSnippet}
            </SyntaxHighlighter>
          );
        }
        return null;
      },
    },
    [INLINES.HYPERLINK]: (node: any, children: any) => {
      return (
        <Link href={node.data.uri} className="text-blue-600 hover:underline" style={{ wordWrap: "break-word" }}>
          {children}
        </Link>
      );
    },
  };
}

export const Blog = ({ blog, recommendations }: { blog: BlogProps, recommendations: BlogProps[] }) => {
  // Format the date
  const publishDate = new Date(blog.sys.firstPublishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  var recommendationsJSX = <div className='flex flex-col space-y-4 font-bold tracking-tighter sm:text-xl'></div>
  if (recommendations.length > 0) {
    recommendationsJSX = <div className='flex flex-col space-y-4 font-bold tracking-tighter sm:text-xl'>Continue reading:</div>
  }

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
              By  <Link href={`/page/about`}><u>{"cr0ss"}</u></Link>{" published on "}{publishDate}{" in "}
              {blog.categoriesCollection.items.length > 0 ? "|" : ""}
              {blog.categoriesCollection.items.map((category: CategoryProps) => (
                <u key={category.slug}><Link href={`/blog/category/` + category.slug}>{category.title}</Link>|</u>
              ))}
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
        <div className='container mx-auto space-y-12 px-4 md:py-24'>
          { recommendationsJSX }
          <div className='space-y-12'>
            <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
              {recommendations.map((recommendation: BlogProps) => (
                <article
                  key={recommendation.title}
                  className='flex h-full flex-col overflow-hidden rounded-lg shadow-lg'
                >
                  <Link href={`/blog/${recommendation.slug}`}>
                    <Image
                      alt='placeholder'
                      className='aspect-[4/3] w-full object-cover'
                      height='263'
                      src={recommendation?.heroImage?.url ?? ''}
                      width='350'
                    />
                  </Link>
                  <div className='flex-1 p-6'>
                    <Link href={`/blog/${recommendation.slug}`}>
                      <h3 className='py-4 text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-50'>
                        {recommendation.title}
                      </h3>
                    </Link>
                    <div className='flex justify-end'>
                      <Link
                        className='inline-flex h-10 items-center justify-center text-sm font-medium'
                        href={`/blog/${recommendation.slug}`}
                      >
                        Read More →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
  );
};