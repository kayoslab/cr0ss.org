import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import Image from 'next/image';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import { ContentfulLivePreview } from '@contentful/live-preview';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';

function renderOptions(links: any) {
  // create an asset map
  const assetMap = new Map();
  // loop through the assets and add them to the map
  for (const asset of links.assets.block) {
    assetMap.set(asset.sys.id, asset);
  }

  return {
    renderNode: {
      [BLOCKS.EMBEDDED_ASSET]: (node: any) => {
        // find the asset in the assetMap by ID
        const asset = assetMap.get(node.data.target.sys.id);

        // render the asset accordingly
        return <img src={asset.url} alt={asset.description} />;
      },
    },
  };
}

export const Blog = ({ blog }: { blog: BlogProps }) => {

  return (
    <div className='flex min-h-screen flex-col items-center justify-between bg-white p-24'>
      <section className='w-full'>
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
              By {"cr0ss"}
            </div>
          </div>
          <div className='space-y-8 lg:space-y-10'>
            <Image
              alt='Blog Image'
              className='aspect-video w-full overflow-hidden rounded-xl object-cover'
              height='365'
              src={blog.heroImage?.url as string}
              width='650'
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
          </div>
        </div>
      </section>
    </div>
  );
};