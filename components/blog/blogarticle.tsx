import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import Image from 'next/image';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import Link from 'next/link';
import { CategoryProps } from '@/lib/contentful/api/props/category';
import { createRichTextOptions, BLOG_ARTICLE_STYLES } from '@/lib/contentful/rich-text-renderer';

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
    <section className='w-full max-w-(--breakpoint-lg)'>
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
                    createRichTextOptions(blog.details.links, BLOG_ARTICLE_STYLES)
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
                      className='aspect-4/3 w-full object-cover'
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