import { BlogProps } from '@/lib/contentful/api/props/blog';
import { ContentfulImage } from '@/components/ui/contentful-image';
import Link from 'next/link';
import { optimizeWithPreset } from '@/lib/contentful/image-utils';
import { Skeleton } from '@/components/ui/skeleton';

interface BlogGridProps {
  posts: BlogProps[];
  currentPage: number;
  totalPages: number;
  basePath: string;
  title: string;
}

// Layout classes shared by the grid and its skeleton so the loading state
// occupies exactly the space the content will take (no layout shift).
const layout = {
  section: 'w-full max-w-7xl mx-auto',
  inner: 'space-y-12 px-4 md:px-6',
  header: 'space-y-4',
  title: 'text-4xl font-bold tracking-tighter sm:text-5xl',
  grid: 'grid gap-8 md:grid-cols-2 lg:grid-cols-3',
  card: 'flex h-full flex-col overflow-hidden rounded-lg shadow-lg',
  image: 'aspect-4/3 w-full object-cover',
  body: 'flex-1 p-6',
  date: 'text-sm text-zinc-500',
  cardTitle: 'py-4 text-2xl font-bold leading-tight text-zinc-900',
  more: 'inline-flex h-10 items-center justify-center text-sm font-medium',
  pagination: 'flex justify-center gap-2 pt-8',
  pageButton:
    'px-4 py-2 text-sm font-medium text-zinc-900 bg-zinc-100 rounded-md hover:bg-zinc-200',
  pageLabel: 'px-4 py-2 text-sm font-medium text-zinc-900',
} as const;

export default function BlogGrid({
  posts,
  currentPage,
  totalPages,
  basePath,
  title,
}: BlogGridProps) {
  // Search results paginate with a query (basePath already carries ?q=);
  // every other list uses /page/N so each page can be prerendered.
  const pageHref = (page: number) =>
    basePath.includes('?')
      ? `${basePath}&page=${page}`
      : page === 1
        ? basePath
        : `${basePath}/page/${page}`;

  return (
    <section className={layout.section}>
      <div className={layout.inner}>
        <div className={layout.header}>
          <h1 className={layout.title}>{title}</h1>
        </div>
        <div className='space-y-12'>
          <div className={layout.grid}>
            {posts?.map((blog: BlogProps, index: number) => {
              const publishDate = new Date(
                blog.sys.firstPublishedAt
              ).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
              const optimizedImageUrl = optimizeWithPreset(
                blog?.heroImage?.url,
                'gridThumbnail'
              );

              return (
                <article key={blog.sys.id} className={layout.card}>
                  <Link href={`/blog/${blog.slug}`}>
                    <ContentfulImage
                      alt={blog.title}
                      className={layout.image}
                      height={450}
                      src={optimizedImageUrl}
                      width={600}
                      // Three columns inside max-w-7xl with gap-8: a card
                      // never exceeds ~400px.
                      sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 400px'
                      // The first card is the page's LCP image.
                      priority={index === 0}
                      fetchPriority={index === 0 ? 'high' : undefined}
                    />
                  </Link>
                  <div className={layout.body}>
                    <div className={layout.date}>{publishDate}</div>
                    <Link href={`/blog/${blog.slug}`}>
                      <h2 className={layout.cardTitle}>{blog.title}</h2>
                    </Link>
                    <div className='flex justify-end'>
                      <Link className={layout.more} href={`/blog/${blog.slug}`}>
                        Read More →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className={layout.pagination}>
            {currentPage > 1 && (
              <Link
                href={pageHref(currentPage - 1)}
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
                href={pageHref(currentPage + 1)}
                className={layout.pageButton}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Loading state with the grid's exact geometry: same wrappers, same card
 * padding, text bars sized to the real line-heights (text-sm 20px, text-2xl
 * with leading-tight 30px, h-10 link) and a title bar the height of the h1.
 */
export function BlogGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <section
      className={layout.section}
      aria-busy='true'
      aria-label='Loading posts'
    >
      <div className={layout.inner}>
        <div className={layout.header}>
          {/* text-4xl line-height 2.5rem, sm:text-5xl 1 → 3rem */}
          <Skeleton className='h-10 w-40 sm:h-12 sm:w-48' />
        </div>
        <div className='space-y-12'>
          <div className={layout.grid}>
            {Array.from({ length: count }).map((_, i) => (
              <article key={i} className={layout.card}>
                <Skeleton className='aspect-4/3 w-full rounded-none' />
                <div className={layout.body}>
                  <Skeleton className='h-5 w-36' />
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
          <div className={layout.pagination}>
            <Skeleton className='h-9 w-32' />
          </div>
        </div>
      </div>
    </section>
  );
}
