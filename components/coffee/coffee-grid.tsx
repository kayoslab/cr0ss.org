import Link from 'next/link';
import { CoffeeProps } from '@/lib/contentful/api/props/coffee';
import { Skeleton } from '@/components/ui/skeleton';

interface CoffeeGridProps {
  coffees: CoffeeProps[];
  currentPage: number;
  totalPages: number;
  basePath: string;
  title: string;
}

const INTRO =
  "A history of specialty coffee I've been experimenting with, along with brew recipes and recommendations for fellow coffee nerds.";

// Layout classes shared by the grid and its skeleton (see BlogGrid).
const layout = {
  section: 'w-full max-w-7xl mx-auto',
  inner: 'space-y-12 px-4 md:px-6',
  header: 'space-y-4',
  title: 'text-4xl font-bold tracking-tighter sm:text-5xl',
  intro: 'text-lg text-neutral-600 max-w-3xl',
  grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  card: 'group block p-6 bg-white border border-neutral-200 rounded-lg hover:shadow-lg transition-shadow',
  pagination: 'flex justify-center gap-2 pt-8',
  pageButton:
    'px-4 py-2 text-sm font-medium text-neutral-900 bg-neutral-100 rounded-md hover:bg-neutral-200',
  pageLabel: 'px-4 py-2 text-sm font-medium text-neutral-900',
} as const;

export default function CoffeeGrid({
  coffees,
  currentPage,
  totalPages,
  basePath,
  title,
}: CoffeeGridProps) {
  return (
    <section className={layout.section}>
      <div className={layout.inner}>
        <div className={layout.header}>
          <h1 className={layout.title}>{title}</h1>
          <p className={layout.intro}>{INTRO}</p>
        </div>
        <div className='space-y-12'>
          <div className={layout.grid}>
            {coffees.map((coffee) => (
              <Link
                key={coffee.sys.id}
                href={`/coffee/${coffee.slug}`}
                className={layout.card}
              >
                <div className='space-y-2'>
                  <h2 className='text-xl font-semibold transition-colors group-hover:text-neutral-600'>
                    {coffee.name}
                  </h2>
                  <p className='text-sm text-neutral-600'>{coffee.roaster}</p>
                  {coffee.country && (
                    <p className='text-sm text-neutral-500'>
                      {coffee.country.name}
                    </p>
                  )}
                  {coffee.region && (
                    <p className='text-xs text-neutral-500'>{coffee.region}</p>
                  )}
                  {coffee.tastingNotes && coffee.tastingNotes.length > 0 && (
                    <div className='flex flex-wrap gap-1 pt-2'>
                      {coffee.tastingNotes.slice(0, 3).map((note, index) => (
                        <span
                          key={index}
                          className='inline-block rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-700'
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {coffees.length === 0 && (
            <p className='py-12 text-center text-neutral-500'>
              No coffees found in the collection yet.
            </p>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={layout.pagination}>
              {currentPage > 1 && (
                <Link
                  href={
                    currentPage === 2
                      ? basePath
                      : `${basePath}/page/${currentPage - 1}`
                  }
                  className={layout.pageButton}
                >
                  Previous
                </Link>
              )}
              <span className={layout.pageLabel}>
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages && (
                <Link
                  href={`${basePath}/page/${currentPage + 1}`}
                  className={layout.pageButton}
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Loading state with the grid's geometry; the intro is real text (it's static). */
export function CoffeeGridSkeleton({ count = 15 }: { count?: number }) {
  return (
    <section
      className={layout.section}
      aria-busy='true'
      aria-label='Loading coffees'
    >
      <div className={layout.inner}>
        <div className={layout.header}>
          <Skeleton className='h-10 w-72 sm:h-12 sm:w-96' />
          <p className={layout.intro}>{INTRO}</p>
        </div>
        <div className='space-y-12'>
          <div className={layout.grid}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className={layout.card}>
                <div className='space-y-2'>
                  {/* text-xl 28px, text-sm 20px, text-sm 20px, text-xs 16px, tags 24px + pt-2 */}
                  <Skeleton className='h-7 w-3/4' />
                  <Skeleton className='h-5 w-1/2' />
                  <Skeleton className='h-5 w-1/3' />
                  <Skeleton className='h-4 w-1/4' />
                  <div className='flex flex-wrap gap-1 pt-2'>
                    <Skeleton className='h-6 w-16' />
                    <Skeleton className='h-6 w-20' />
                    <Skeleton className='h-6 w-14' />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={layout.pagination}>
            <Skeleton className='h-9 w-32' />
          </div>
        </div>
      </div>
    </section>
  );
}
