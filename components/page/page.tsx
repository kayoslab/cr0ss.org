import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import Image from 'next/image';
import { PageProps } from '@/lib/contentful/api/props/page';
import { createRichTextOptions, PAGE_STYLES } from '@/lib/contentful/rich-text-renderer';
import { optimizeWithPreset } from '@/lib/contentful/image-utils';

export const Page = ({ page }: { page: PageProps }) => {
  return (
    <section className='w-full max-w-7xl mx-auto'>
      <div className='space-y-12 px-4 md:px-6'>
        <div className='space-y-4'>
          <h1
            className='text-4xl font-bold tracking-tighter sm:text-5xl'
          >
            {page.title}
          </h1>
        </div>
        <div className='space-y-8 lg:space-y-10'>
          {page.heroImage?.url && (
            <Image
              alt={page.title}
              className='aspect-video w-full overflow-hidden rounded-xl object-cover'
              src={optimizeWithPreset(page.heroImage.url, 'hero')}
              width={0}
              height={0}
              sizes="100vw"
              style={{ width: '100%', height: 'auto' }}
              priority={true}
            />
          )}
          <div className='space-y-4 md:space-y-6'>
            <div className='space-y-2'>
              <div
                className='prose prose-lg max-w-full text-zinc-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed'
              >
                {documentToReactComponents(
                  page.details.json,
                  createRichTextOptions(page.details.links, PAGE_STYLES, { enableCodeSnippets: false })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};