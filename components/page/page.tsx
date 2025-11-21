import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import Image from 'next/image';
import { PageProps } from '@/lib/contentful/api/props/page';
import { createRichTextOptions, PAGE_STYLES } from '@/lib/contentful/rich-text-renderer';

export const Page = ({ page }: { page: PageProps }) => {
  return (
    <section className='w-full max-w-(--breakpoint-lg)'>
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
            src={page.heroImage?.url as string}
            width={0}
            height={0}
            sizes="100vw"
            style={{ width: '100%', height: 'auto' }} // optional
          />
          <div className='space-y-4 md:space-y-6'>
            <div className='space-y-2'>
              <div
                className='prose max-w-[900px] text-zinc-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed'
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