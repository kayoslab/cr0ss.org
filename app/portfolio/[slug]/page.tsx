import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { getAllProjects, getProject } from '@/lib/contentful/api/portfolio';
import {
  createRichTextOptions,
  PAGE_STYLES,
} from '@/lib/contentful/rich-text-renderer';
import { CaptureForm } from '@/components/capture/capture-form';

export const revalidate = 3600;

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

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const isExternal = Boolean(project.external);

  return (
    <main className="flex flex-col items-center bg-white pb-16">
      <article className="w-full max-w-3xl px-6 pt-10 lg:px-8">
        <Link
          href="/portfolio"
          className="text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          ← Portfolio
        </Link>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {project.title}
        </h1>
        <p className="mt-4 text-lg text-gray-600">{project.summary}</p>

        {project.url && (
          <a
            href={project.url}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:border-gray-400 hover:bg-gray-50"
          >
            Visit project
            <ArrowUpRight className="h-4 w-4" />
          </a>
        )}

        {project.description?.json && (
          <div className="mt-8">
            {documentToReactComponents(
              project.description.json,
              createRichTextOptions(project.description.links, PAGE_STYLES)
            )}
          </div>
        )}

        <CaptureForm />
      </article>
    </main>
  );
}
