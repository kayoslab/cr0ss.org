import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getAllProjects } from '@/lib/contentful/api/portfolio';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Portfolio | cr0ss.mind',
  description: 'Things I’ve been building.',
};

export default async function PortfolioPage() {
  const { items } = await getAllProjects();

  return (
    <main className="flex flex-col items-center bg-white pb-12">
      <div className="w-full max-w-4xl px-6 pt-10 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Portfolio
        </h1>
        <p className="mt-4 text-lg text-gray-600">Things I&apos;ve been building.</p>

        <div className="mt-8 grid gap-6">
          {items.map((project) => (
            <Link
              key={project.slug}
              href={`/portfolio/${project.slug}`}
              className="group block rounded-xl border border-gray-200 p-6 transition-colors hover:border-gray-400 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{project.title}</h2>
                <ArrowUpRight className="h-5 w-5 text-gray-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gray-600" />
              </div>
              <p className="mt-2 text-gray-600">{project.summary}</p>
            </Link>
          ))}

          {items.length === 0 && (
            <p className="text-gray-500">No projects yet — check back soon.</p>
          )}
        </div>
      </div>
    </main>
  );
}
