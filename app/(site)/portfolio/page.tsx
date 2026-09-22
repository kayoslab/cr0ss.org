import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getAllProjects } from '@/lib/contentful/api/portfolio';
import { CaptureForm } from '@/components/capture/capture-form';

export const metadata: Metadata = {
  title: 'Portfolio | cr0ss.mind',
  description: 'Things I’ve been building.',
};

// Intro copy (repurposed from the retired About page).
const INTRO_PARAGRAPHS = [
  'With over 15 years in software engineering and a decade of experience in online retail, I focus on bridging the gap between technology and business with clarity, empathy, and long-term impact. I work with prospects and clients to design modern solutions that are not just technically sound, but culturally sustainable, solutions people want to adopt, own and grow with.',
  'My roots are in engineering, but my strength lies in building meaningful relationships and translating complex architecture into human terms. I’ve worked as a solutions architect and requirements engineer, always with a focus on empowering teams, whether it’s a marketer seeing new opportunities for engagement or an engineer excited by how easily they can ship a change.',
  'I leverage my expertise in e-commerce, cloud, and MACH (microservices, API-first, cloud-native, and headless) solutions to guide and advise clients on their digital transformation journeys. At the same time I believe composable commerce isn’t a silver bullet, it’s a shift that succeeds only when your people are ready to lead the way. Beyond client work, I care deeply about how digital commerce evolves, particularly the tension between fast retail and the growing need for ethical, personalized, customer-centric experiences.',
];

/** Normalize a search param that may be a string, array, or undefined. */
function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// The "Let's stay in touch" box only appears when arriving via a campaign
// link (e.g. the NFC card → /portfolio?campaign-id=shoreditch-meetup). It's
// the one part of the page that depends on the URL, so it streams in on its
// own while the rest is prerendered.
async function CampaignCapture({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const campaignId = firstParam((await searchParams)['campaign-id']);
  if (!campaignId) return null;
  return (
    <div className='mb-12'>
      <CaptureForm campaignId={campaignId} />
    </div>
  );
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { items } = await getAllProjects();

  return (
    <main className='flex flex-col items-center bg-white pb-12'>
      <div className='w-full max-w-4xl px-6 pt-10 lg:px-8'>
        <Suspense>
          <CampaignCapture searchParams={searchParams} />
        </Suspense>

        <section>
          <h1 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
            Who am I?
          </h1>
          <div className='mt-6 space-y-4 text-lg leading-relaxed text-gray-600'>
            {INTRO_PARAGRAPHS.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </section>

        <h2 className='mt-12 text-2xl font-bold tracking-tight text-gray-900'>
          Things I&apos;ve been building
        </h2>

        <div className='mt-6 grid gap-6'>
          {items.map((project) => (
            <Link
              key={project.slug}
              href={`/portfolio/${project.slug}`}
              className='group block rounded-xl border border-gray-200 p-6 transition-colors hover:border-gray-400 hover:bg-gray-50'
            >
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-semibold text-gray-900'>
                  {project.title}
                </h3>
                <ArrowUpRight className='h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gray-600' />
              </div>
              <p className='mt-2 text-gray-600'>{project.summary}</p>
            </Link>
          ))}

          {items.length === 0 && (
            <p className='text-gray-500'>No projects yet — check back soon.</p>
          )}
        </div>
      </div>
    </main>
  );
}
