import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight } from 'lucide-react';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { getAllProjects, getProject } from '@/lib/contentful/api/portfolio';
import {
  createRichTextOptions,
  PAGE_STYLES,
} from '@/lib/contentful/rich-text-renderer';

export async function generateStaticParams() {
  const { items } = await getAllProjects();
  return items.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: 'Project not found | cr0ss.mind' };
  return {
    title: `${project.title} | cr0ss.mind`,
    description: project.summary,
  };
}

async function ProjectContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const isExternal = Boolean(project.external);

  return (
    <main className='flex flex-col items-center bg-white pb-16'>
      <article className='w-full max-w-3xl px-6 pt-10 lg:px-8'>
        <Link
          href='/portfolio'
          className='text-sm font-medium text-gray-500 hover:text-gray-900'
        >
          ← Portfolio
        </Link>

        <h1 className='mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
          {project.title}
        </h1>
        <p className='mt-4 text-lg text-gray-600'>{project.summary}</p>

        {project.heroImage?.url && (
          <Image
            src={project.heroImage.url}
            alt={project.heroImage.title || project.title}
            width={1200}
            height={630}
            className='mt-8 w-full rounded-xl object-cover'
            sizes='(max-width: 768px) 100vw, 768px'
            priority
          />
        )}

        <div className='mt-6 flex flex-wrap gap-3'>
          {project.url && (
            <a
              href={project.url}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className='inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:border-gray-400 hover:bg-gray-50'
            >
              Visit project
              <ArrowUpRight className='h-4 w-4' />
            </a>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:border-gray-400 hover:bg-gray-50'
            >
              <svg
                viewBox='0 0 24 24'
                fill='currentColor'
                className='h-4 w-4'
                aria-hidden='true'
              >
                <path d='M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.42.36.79 1.08.79 2.18 0 1.58-.01 2.85-.01 3.24 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z' />
              </svg>
              View on GitHub
            </a>
          )}
        </div>

        {project.description?.json && (
          <div className='mt-8'>
            {documentToReactComponents(
              project.description.json,
              createRichTextOptions(project.description.links, PAGE_STYLES)
            )}
          </div>
        )}
      </article>
    </main>
  );
}

function ContentLoading() {
  return (
    <main
      className='flex flex-col items-center bg-white pb-16'
      aria-busy='true'
    >
      <article className='w-full max-w-3xl px-6 pt-10 lg:px-8'>
        <Skeleton className='h-5 w-24' />
        <Skeleton className='mt-4 h-9 w-3/4 sm:h-10' />
        <div className='mt-4 space-y-2'>
          <Skeleton className='h-7 w-full' />
          <Skeleton className='h-7 w-5/6' />
        </div>
        <Skeleton className='mt-8 aspect-[1200/630] w-full rounded-xl' />
        <div className='mt-6 flex flex-wrap gap-3'>
          <Skeleton className='h-10 w-32 rounded-lg' />
          <Skeleton className='h-10 w-36 rounded-lg' />
        </div>
        <div className='mt-8 space-y-6'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='space-y-2'>
              <Skeleton className='h-5 w-full' />
              <Skeleton className='h-5 w-full' />
              <Skeleton className='h-5 w-3/4' />
            </div>
          ))}
        </div>
      </article>
    </main>
  );
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<ContentLoading />}>
      <ProjectContent params={params} />
    </Suspense>
  );
}
