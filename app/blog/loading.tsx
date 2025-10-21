import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Loading skeleton for blog grid (list, category, search pages)
 */
export default function BlogGridLoading() {
  return (
    <section className='w-full pt-12 max-w-(--breakpoint-lg)'>
      <div className='container mx-auto space-y-12 px-4 md:px-6'>
        {/* Header skeleton */}
        <div className='flex flex-col items-center justify-center space-y-4 text-center'>
          <div className='space-y-2'>
            <Skeleton className='h-12 w-64 mx-auto sm:h-14 sm:w-96' />
          </div>
        </div>

        <div className='space-y-12'>
          {/* Blog cards grid skeleton */}
          <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 9 }).map((_, i) => (
              <article
                key={i}
                className='flex h-full flex-col overflow-hidden rounded-lg shadow-lg border border-neutral-200/60 dark:border-neutral-700'
              >
                {/* Hero image skeleton */}
                <Skeleton className='aspect-4/3 w-full rounded-none' />

                <div className='flex-1 p-6 space-y-4'>
                  {/* Date skeleton */}
                  <Skeleton className='h-4 w-32' />

                  {/* Title skeleton */}
                  <div className='space-y-2'>
                    <Skeleton className='h-7 w-full' />
                    <Skeleton className='h-7 w-4/5' />
                  </div>

                  {/* Read more link skeleton */}
                  <div className='flex justify-end pt-2'>
                    <Skeleton className='h-6 w-28' />
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination skeleton */}
          <div className="flex justify-center gap-2 pt-8">
            <Skeleton className='h-10 w-24' />
            <Skeleton className='h-10 w-32' />
            <Skeleton className='h-10 w-24' />
          </div>
        </div>
      </div>
    </section>
  );
}
