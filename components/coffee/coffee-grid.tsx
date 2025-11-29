import Link from 'next/link';
import { CoffeeProps } from '@/lib/contentful/api/props/coffee';

interface CoffeeGridProps {
  coffees: CoffeeProps[];
  currentPage: number;
  totalPages: number;
  basePath: string;
  title: string;
}

export default function CoffeeGrid({ coffees, currentPage, totalPages, basePath, title }: CoffeeGridProps) {
  return (
    <section className='w-full max-w-7xl mx-auto'>
      <div className='space-y-12 px-4 md:px-6'>
        <div className='space-y-4'>
          <h1 className='text-4xl font-bold tracking-tighter sm:text-5xl'>
            {title}
          </h1>
          <p className='text-lg text-neutral-600 max-w-3xl'>
            A history of specialty coffee I've been experimenting with, along with brew recipes and recommendations for fellow coffee nerds.
          </p>
        </div>
        <div className='space-y-12'>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coffees.map((coffee) => (
              <Link
                key={coffee.sys.id}
                href={`/coffee/${coffee.slug}`}
                className="group block p-6 bg-white border border-neutral-200 rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold group-hover:text-neutral-600 transition-colors">
                    {coffee.name}
                  </h2>

                  <p className="text-sm text-neutral-600">
                    {coffee.roaster}
                  </p>

                  {coffee.country && (
                    <p className="text-sm text-neutral-500">
                      {coffee.country.name}
                    </p>
                  )}

                  {coffee.region && (
                    <p className="text-xs text-neutral-400">
                      {coffee.region}
                    </p>
                  )}

                  {coffee.tastingNotes && coffee.tastingNotes.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {coffee.tastingNotes.slice(0, 3).map((note, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-neutral-100 text-neutral-700 rounded"
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
            <p className="text-center text-neutral-500 py-12">
              No coffees found in the collection yet.
            </p>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-8">
              {currentPage > 1 && (
                <Link
                  href={`${basePath}?page=${currentPage - 1}`}
                  className="px-4 py-2 text-sm font-medium text-neutral-900 bg-neutral-100 rounded-md hover:bg-neutral-200"
                >
                  Previous
                </Link>
              )}

              <span className="px-4 py-2 text-sm font-medium text-neutral-900">
                Page {currentPage} of {totalPages}
              </span>

              {currentPage < totalPages && (
                <Link
                  href={`${basePath}?page=${currentPage + 1}`}
                  className="px-4 py-2 text-sm font-medium text-neutral-900 bg-neutral-100 rounded-md hover:bg-neutral-200"
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
