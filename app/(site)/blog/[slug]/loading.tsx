import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for individual blog post page
 */
export default function BlogPostLoading() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
      <section className='w-full max-w-7xl mx-auto'>
      <div className='space-y-12 px-4 md:px-6'>
        {/* Title and metadata */}
        <div className='space-y-4'>
          {/* Title skeleton */}
          <div className='space-y-3'>
            <Skeleton className='h-12 w-full sm:h-14' />
            <Skeleton className='h-12 w-4/5 sm:h-14' />
          </div>

          {/* Metadata (author, date, categories) skeleton */}
          <div className='space-y-2'>
            <Skeleton className='h-6 w-full max-w-2xl md:h-7' />
            <Skeleton className='h-6 w-3/4 max-w-xl md:h-7' />
          </div>
        </div>

        <div className='space-y-8 lg:space-y-10'>
          {/* Hero image skeleton */}
          <Skeleton className='aspect-video w-full rounded-xl' />

          {/* Summary skeleton */}
          <div className='flex flex-col justify-between md:flex-row'>
            <div className='max-w-none space-y-3'>
              <Skeleton className='h-8 w-full md:h-9 lg:h-10 xl:h-11' />
              <Skeleton className='h-8 w-full md:h-9 lg:h-10 xl:h-11' />
              <Skeleton className='h-8 w-4/5 md:h-9 lg:h-10 xl:h-11' />
            </div>
          </div>

          {/* Article content skeleton */}
          <div className='space-y-4 md:space-y-6'>
            <div className='space-y-4 max-w-none'>
              {/* Paragraphs */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className='space-y-2'>
                  <Skeleton className='h-5 w-full md:h-6' />
                  <Skeleton className='h-5 w-full md:h-6' />
                  <Skeleton className='h-5 w-full md:h-6' />
                  <Skeleton className='h-5 w-4/5 md:h-6' />
                </div>
              ))}

              {/* Code block placeholder */}
              <div className='my-6'>
                <Skeleton className='h-48 w-full rounded-lg' />
              </div>

              {/* More paragraphs */}
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`p2-${i}`} className='space-y-2'>
                  <Skeleton className='h-5 w-full md:h-6' />
                  <Skeleton className='h-5 w-full md:h-6' />
                  <Skeleton className='h-5 w-3/4 md:h-6' />
                </div>
              ))}
            </div>
          </div>

          {/* Author quote skeleton */}
          <div className='flex flex-col justify-between md:flex-row'>
            <div className="max-w-none space-y-4">
              <Skeleton className='h-8 w-8' />
              <div className='space-y-2'>
                <Skeleton className='h-7 w-full' />
                <Skeleton className='h-7 w-4/5' />
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations section skeleton */}
        <div className='space-y-12 px-4 md:py-24'>
          <Skeleton className='h-8 w-48' />

          <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <article
                key={i}
                className='flex h-full flex-col overflow-hidden rounded-lg shadow-lg border border-neutral-200/60'
              >
                <Skeleton className='aspect-4/3 w-full rounded-none' />
                <div className='flex-1 p-6 space-y-4'>
                  <Skeleton className='h-4 w-32' />
                  <div className='space-y-2'>
                    <Skeleton className='h-6 w-full' />
                    <Skeleton className='h-6 w-3/4' />
                  </div>
                  <div className='flex justify-end pt-2'>
                    <Skeleton className='h-5 w-24' />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
    </main>
  );
}
