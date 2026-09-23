import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading state for a blog post, mirroring components/blog/blogarticle.tsx:
 * same wrappers and spacing, bars sized to the real line-heights.
 */
export default function BlogPostLoading() {
  return (
    <main
      className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'
      aria-busy='true'
      aria-label='Loading post'
    >
      <section className='mx-auto w-full max-w-7xl'>
        <div className='space-y-12 px-4 md:px-6'>
          {/* Title (text-4xl → 40px lines, sm:text-5xl → 48px) and byline */}
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Skeleton className='h-10 w-full sm:h-12' />
              <Skeleton className='h-10 w-2/3 sm:h-12' />
            </div>
            <Skeleton className='h-6 w-full max-w-lg md:h-7' />
          </div>

          <div className='space-y-8 lg:space-y-10'>
            {/* Hero image */}
            <Skeleton className='aspect-video w-full rounded-xl' />

            {/* Summary (md:text-2xl … xl:text-4xl) */}
            <div className='space-y-2'>
              <Skeleton className='h-6 w-full md:h-8 lg:h-9 xl:h-10' />
              <Skeleton className='h-6 w-11/12 md:h-8 lg:h-9 xl:h-10' />
              <Skeleton className='h-6 w-3/4 md:h-8 lg:h-9 xl:h-10' />
            </div>

            {/* Article body: prose-lg paragraphs */}
            <div className='space-y-6'>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className='space-y-2'>
                  <Skeleton className='h-5 w-full md:h-6' />
                  <Skeleton className='h-5 w-full md:h-6' />
                  <Skeleton className='h-5 w-full md:h-6' />
                  <Skeleton className='h-5 w-4/5 md:h-6' />
                </div>
              ))}
            </div>

            {/* Author quote */}
            <div className='space-y-4'>
              <Skeleton className='h-8 w-8' />
              <div className='space-y-2'>
                <Skeleton className='h-7 w-full' />
                <Skeleton className='h-7 w-4/5' />
              </div>
            </div>
          </div>
        </div>

        {/* "Continue reading" recommendations */}
        <div className='space-y-12 px-4 md:py-24'>
          <Skeleton className='h-7 w-44' />
          <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <article
                key={i}
                className='flex h-full flex-col overflow-hidden rounded-lg shadow-lg'
              >
                <Skeleton className='aspect-4/3 w-full rounded-none' />
                <div className='flex-1 p-6'>
                  <div className='space-y-1.5 py-4'>
                    <Skeleton className='h-6 w-full' />
                    <Skeleton className='h-6 w-3/4' />
                  </div>
                  <div className='flex h-10 items-center justify-end'>
                    <Skeleton className='h-5 w-24' />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
