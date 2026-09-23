import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Loading state shaped like the dashboard overview (app/dashboard/page.tsx):
 * heading, four KPI cards, two goal cards, five quick links. The same
 * primitives (Card, grid classes) keep the geometry identical.
 */
export default function DashboardSkeleton() {
  return (
    <div
      className='w-full space-y-6'
      aria-busy='true'
      aria-label='Loading dashboard'
    >
      <div className='space-y-1'>
        <Skeleton className='h-8 w-40' />
        <Skeleton className='h-6 w-80 max-w-full' />
      </div>

      {/* KPI tiles: StatCard = header (icon + description) + text-3xl value + text-xs subtitle */}
      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className='pb-2'>
              <Skeleton className='mb-2 h-4 w-4' />
              <Skeleton className='h-5 w-24' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-9 w-16' />
              <Skeleton className='mt-1 h-4 w-12' />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Goals: two cards, three progress rows each */}
      <div className='grid gap-6 md:grid-cols-2'>
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className='rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm'
          >
            <Skeleton className='mb-4 h-7 w-32' />
            <div className='space-y-4'>
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className='space-y-2'>
                  <div className='flex justify-between'>
                    <Skeleton className='h-5 w-24' />
                    <Skeleton className='h-5 w-16' />
                  </div>
                  <Skeleton className='h-2 w-full' />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className='flex flex-col items-center gap-2 rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm'
          >
            <Skeleton className='h-8 w-8' />
            <Skeleton className='h-6 w-20' />
          </div>
        ))}
      </div>
    </div>
  );
}
